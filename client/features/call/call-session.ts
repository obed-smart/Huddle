import type { Socket } from "socket.io-client";

import { toast } from "@/lib/notify";
import { ensureWebrtcAdapter } from "@/lib/webrtc/adapter";
import { useCall } from "./call-store";
import { CALL_EVENTS as E } from "./signaling/events";
import type {
  AcceptAck, EndedEvt, IncomingEvt, InitiateAck, NewAcceptEvt, NewPublishEvt,
} from "./signaling/types";
import type { CallMedia as Media, CallPeer, CallSnapshot } from "./call-types";
import { CallMedia } from "./call-media";

const ACK_TIMEOUT = 15000;
/** How long a call rings before it gives up on its own. */
const RING_TIMEOUT = 35000;
type Listener = (data: unknown) => void;

/**
 * The one live call. A module singleton (not React) so a call survives route
 * changes and re-renders. A root component binds the socket to it. This is the
 * control plane: intents and signaling. The media plane lives in CallMedia.
 */
class CallSession {
  private socket: Socket | null = null;
  private iceServers: RTCIceServer[] = [];
  private bound: Array<[string, Listener]> = [];
  private ringTimer: ReturnType<typeof setTimeout> | null = null;
  private media = new CallMedia({
    getCall: () => this.call(),
    getIce: () => this.iceServers,
    request: (event, payload) => this.request(event, payload),
    patch: (partial) => this.patch(partial),
    fail: () => this.hangUp(),
  });

  attach(socket: Socket) {
    if (this.socket === socket) return;
    this.detach();
    this.socket = socket;
    this.listen(E.incoming, (d) => this.onIncoming(d as IncomingEvt));
    this.listen(E.newAccept, (d) => this.onNewAccept(d as NewAcceptEvt));
    this.listen(E.newPublish, (d) => this.onNewPublish(d as NewPublishEvt));
    this.listen(E.ended, (d) => this.onEnded(d as EndedEvt));
  }

  detach() {
    for (const [event, fn] of this.bound) this.socket?.off(event, fn);
    this.bound = [];
    this.socket = null;
  }

  private listen(event: string, fn: Listener) {
    this.socket?.on(event, fn);
    this.bound.push([event, fn]);
  }

  private request<T>(event: string, payload: unknown): Promise<T> {
    if (!this.socket) return Promise.reject(new Error("call socket is not connected"));
    return this.socket.timeout(ACK_TIMEOUT).emitWithAck(event, payload) as Promise<T>;
  }

  // ---- intents, called by the UI ----

  async initiate({ conversationId, peer, media }: { conversationId: string; peer: CallPeer; media: Media }) {
    void ensureWebrtcAdapter();
    this.media.reset();
    this.set(this.fresh(null, conversationId, peer, media, "outgoing"));
    try {
      const ack = await this.request<InitiateAck>(E.initiate, { conversationId, callMediaType: media });
      if (!ack?.success) return this.fail();
      this.iceServers = ack.iceServers ?? [];
      this.patch({ callId: ack.callId });
      this.armRing();
    } catch {
      this.fail();
    }
  }

  async accept(rejoin = false) {
    const call = this.call();
    if (!call?.callId) return;
    void ensureWebrtcAdapter();
    // Expand to the full screen so the connecting state is visible.
    this.patch({ minimized: false });
    try {
      const ack = await this.request<AcceptAck>(E.accept, {
        callId: call.callId,
        conversationId: call.conversationId,
        callMediaType: call.media,
        rejoin,
      });
      if (!ack?.success) return this.hangUp();
      this.iceServers = ack.iceServers ?? this.iceServers;
      await this.media.start();
    } catch {
      this.hangUp();
    }
  }

  hangUp() {
    const call = this.call();
    if (call?.callId) {
      this.request(E.leave, { callId: call.callId, conversationId: call.conversationId }).catch(() => {});
    }
    this.close();
  }

  setMuted(muted: boolean) {
    const call = this.call();
    if (!call) return;
    this.media.setMicEnabled(!muted);
    this.patch({ muted });
    if (call.callId) {
      this.request(E.mediaState, { callId: call.callId, audioOn: !muted, videoOn: call.media === "video" }).catch(() => {});
    }
  }

  setSpeaker(speaker: boolean) {
    this.patch({ speaker });
  }

  // ---- signaling handlers ----

  private onIncoming(d: IncomingEvt) {
    void ensureWebrtcAdapter();
    const media: Media = d.callMediaType === "video" ? "video" : "audio";
    const peer: CallPeer = { id: d.fromId, name: d.fromName, avatar: d.avatarUrl ?? null };
    // An inbound ring starts collapsed as the toast; tapping it expands.
    this.set({ ...this.fresh(d.callId, d.conversationId, peer, media, "incoming"), minimized: true });
    this.armRing();
  }

  private onNewAccept(d: NewAcceptEvt) {
    const call = this.call();
    if (!call || call.callId !== d.callId) return;
    // The callee answered: now we (the caller) bring up our own media.
    void this.media.start();
  }

  private onNewPublish(d: NewPublishEvt) {
    const call = this.call();
    if (!call || call.callId !== d.callId) return;
    this.media.queuePublisher(d.userId, d.tracks.map((t) => t.kind));
  }

  private onEnded(d: EndedEvt) {
    const call = this.call();
    if (!call || call.callId !== d.callId) return;
    this.close();
  }

  // ---- helpers ----

  private fresh(callId: string | null, conversationId: string, peer: CallPeer, media: Media, phase: CallSnapshot["phase"]): CallSnapshot {
    return { callId, conversationId, peer, media, phase, muted: false, speaker: true, minimized: false, startedAt: null };
  }

  /** Ring for a while, then give up on an unanswered call on either side. */
  private armRing() {
    this.clearRing();
    this.ringTimer = setTimeout(() => {
      const phase = this.call()?.phase;
      if (phase === "outgoing" || phase === "connecting") {
        toast("No answer.");
        this.hangUp();
      } else if (phase === "incoming") {
        this.hangUp();
      }
    }, RING_TIMEOUT);
  }

  private clearRing() {
    if (this.ringTimer) clearTimeout(this.ringTimer);
    this.ringTimer = null;
  }

  private close() {
    this.clearRing();
    this.media.reset();
    this.set(null);
  }

  private fail() {
    this.close();
  }

  private call() { return useCall.getState().call; }
  private set(call: CallSnapshot | null) { useCall.getState().setCall(call); }
  private patch(partial: Partial<CallSnapshot>) { useCall.getState().patch(partial); }
}

export const callSession = new CallSession();
