import type { Socket } from "socket.io-client";

import { toast } from "@/lib/notify";
import { ensureWebrtcAdapter } from "@/lib/webrtc/adapter";
import { useCall } from "./call-store";
import { CALL_EVENTS as E } from "./signaling/events";
import type {
  AcceptAck, EndedEvt, HandledEvt, IncomingEvt, InitiateAck,
  MediaStateEvt, NewAcceptEvt, NewPublishEvt, RejectedEvt,
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
    this.listen(E.ended, (d) => this.endIfMine((d as EndedEvt).callId));
    this.listen(E.rejected, (d) => this.endIfMine((d as RejectedEvt).callId, "Call declined."));
    this.listen(E.handled, (d) => this.endIfMine((d as HandledEvt).callId));
    this.listen(E.newMediaState, (d) => this.onMediaState(d as MediaStateEvt));
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

  async initiate({ conversationId, peer, media }: { conversationId: string; peer: CallPeer; media: Media }) {
    void ensureWebrtcAdapter();
    this.media.reset();
    this.set(this.fresh(null, conversationId, peer, media, "outgoing"));
    void this.media.localVideo.preview();
    try {
      const ack = await this.request<InitiateAck>(E.initiate, { conversationId, callMediaType: media });
      if (!ack?.success) return this.close();
      this.iceServers = ack.iceServers ?? [];
      this.patch({ callId: ack.callId });
      this.armRing();
    } catch {
      this.close();
    }
  }

  async accept(rejoin = false) {
    const call = this.call();
    if (!call?.callId) return;
    void ensureWebrtcAdapter();
    this.patch({ minimized: false });
    try {
      const ack = await this.request<AcceptAck>(E.accept, {
        callId: call.callId,
        conversationId: call.conversationId,
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
      const event = call.phase === "incoming" ? E.reject : E.leave;
      this.request(event, { callId: call.callId, conversationId: call.conversationId }).catch(() => {});
    }
    this.close();
  }

  setMuted(muted: boolean) {
    this.media.setMicEnabled(!muted);
    this.patch({ muted });
  }

  setCamera(camOn: boolean) {
    if (!camOn) { void this.media.localVideo.stop(); return this.patch({ camOn: false }); }
    if (!this.media.localVideo.hasVideo()) return void this.media.localVideo.upgrade();
    this.media.setCamEnabled(true);
    this.patch({ camOn: true });
  }

  flipCamera() {
    void this.media.localVideo.flip();
  }
  upgradeToVideo() {
    void this.media.localVideo.upgrade();
  }

  setSpeaker(speaker: boolean) {
    this.patch({ speaker });
  }

  private onIncoming(d: IncomingEvt) {
    void ensureWebrtcAdapter();
    const media: Media = d.callMediaType === "video" ? "video" : "audio";
    const peer: CallPeer = { id: d.fromId, name: d.fromName, avatar: d.avatarUrl ?? null };
    // An inbound ring starts collapsed as the toast; tapping it expands.
    this.set({ ...this.fresh(d.callId, d.conversationId, peer, media, "incoming"), minimized: true });
    this.armRing();
  }

  // The callee answered: now we (the caller) bring up our own media.
  private onNewAccept(d: NewAcceptEvt) {
    const call = this.call();
    if (!call || call.callId !== d.callId) return;
    void this.media.start();
  }

  private onNewPublish(d: NewPublishEvt) {
    const call = this.call();
    if (!call || call.callId !== d.callId) return;
    const kinds = d.tracks.map((t) => t.kind);
    this.media.queuePublisher(d.userId, kinds);
    // The other side added a camera: become a video call; our camera stays off.
    if (kinds.includes("cam") && call.media !== "video") this.patch({ media: "video", camOn: false });
  }

  private onMediaState(d: MediaStateEvt) {
    if (this.call()?.callId === d.callId) this.media.dropRemote(d.userId, d.kind);
  }

  private endIfMine(callId: string, message?: string) {
    if (this.call()?.callId !== callId) return;
    if (message) toast(message);
    this.close();
  }

  private fresh(callId: string | null, conversationId: string, peer: CallPeer, media: Media, phase: CallSnapshot["phase"]): CallSnapshot {
    return { callId, conversationId, peer, media, phase, muted: false, camOn: true, speaker: true, minimized: false, startedAt: null };
  }

  /** Ring for a while, then give up on an unanswered call on either side. */
  private armRing() {
    this.clearRing();
    this.ringTimer = setTimeout(() => {
      const phase = this.call()?.phase;
      if (phase !== "outgoing" && phase !== "connecting" && phase !== "incoming") return;
      if (phase !== "incoming") toast("No answer.");
      this.hangUp();
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

  private call() { return useCall.getState().call; }
  private set(call: CallSnapshot | null) { useCall.getState().setCall(call); }
  private patch(partial: Partial<CallSnapshot>) { useCall.getState().patch(partial); }
}

export const callSession = new CallSession();
