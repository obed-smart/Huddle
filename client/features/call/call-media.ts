import { CALL_EVENTS as E } from "./signaling/events";
import type { CallStatus, PublishAck, SubscribeAck, SubscribeTarget } from "./signaling/types";
import type { CallSnapshot } from "./call-types";
import { makeAnswer, makeOffer, trackKind } from "./call-rtc";
import { RemoteAudio } from "./call-audio";

/** What the media plane needs from the session: the live call, ICE servers, the
    backend channel, a way to patch UI state, and a bail-out. */
export type MediaDeps = {
  getCall: () => CallSnapshot | null;
  getIce: () => RTCIceServer[];
  request: <T>(event: string, payload: unknown) => Promise<T>;
  patch: (partial: Partial<CallSnapshot>) => void;
  fail: () => void;
};

/**
 * The media plane: one peer connection that publishes our tracks and pulls
 * everyone else's. Every SDP exchange runs through one queue, because a session
 * negotiates one at a time. Subscriptions are deduped by `userId:kind`.
 */
export class CallMedia {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private midToPublisher = new Map<string, { userId: string; kind: string }>();
  private pulled = new Set<string>();
  private pending: SubscribeTarget[] = [];
  private published = false;
  private chain: Promise<void> = Promise.resolve();
  private audio = new RemoteAudio();

  constructor(private deps: MediaDeps) {}

  active() {
    return this.pc !== null;
  }

  /** Bring up our media: publish our tracks, then pull whoever is already here. */
  async start() {
    const call = this.deps.getCall();
    if (!call?.callId || this.pc) return;
    this.deps.patch({ phase: "connecting" });
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.media === "video",
      });
      const pc = new RTCPeerConnection({ iceServers: this.deps.getIce() });
      this.pc = pc;
      this.installHandlers(pc);
      const transceivers = this.localStream
        .getTracks()
        .map((track) => pc.addTransceiver(track, { direction: "sendonly" }));
      const description = await makeOffer(pc);
      const tracks = transceivers
        .filter((t) => t.sender.track && t.mid)
        .map((t) => ({ mid: t.mid as string, kind: trackKind(t.sender.track as MediaStreamTrack) }));
      const ack = await this.deps.request<PublishAck>(E.publish, { callId: call.callId, description, tracks });
      if (!ack?.success) return this.deps.fail();
      await pc.setRemoteDescription(ack.description);
      this.published = true;
      const first = [...(ack.existing ?? []), ...this.pending];
      this.pending = [];
      if (first.length) this.enqueue(() => this.subscribe(first));
    } catch {
      this.deps.fail();
    }
  }

  /** A newcomer published. Pull them now, or hold them until we have published. */
  queuePublisher(userId: string, kinds: string[]) {
    const target: SubscribeTarget = { userId, kinds: kinds as SubscribeTarget["kinds"] };
    if (!this.published) this.pending.push(target);
    else this.enqueue(() => this.subscribe([target]));
  }

  setMicEnabled(enabled: boolean) {
    this.localStream?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  reset() {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
      this.pc = null;
    }
    this.audio.clear();
    this.midToPublisher.clear();
    this.pulled.clear();
    this.pending = [];
    this.published = false;
    this.chain = Promise.resolve();
  }

  private enqueue(op: () => Promise<void>) {
    this.chain = this.chain.then(op).catch(() => {});
  }

  private async subscribe(targets: SubscribeTarget[]) {
    const call = this.deps.getCall();
    const pc = this.pc;
    if (!call?.callId || !pc) return;
    const fresh = targets
      .map((t) => ({ userId: t.userId, kinds: (t.kinds ?? []).filter((k) => !this.pulled.has(`${t.userId}:${k}`)) }))
      .filter((t) => t.kinds.length > 0);
    if (!fresh.length) return;
    const ack = await this.deps.request<SubscribeAck>(E.subscribe, { callId: call.callId, targets: fresh });
    if (!ack?.success) return;
    for (const t of ack.subscribed) {
      this.midToPublisher.set(t.mid, { userId: t.userId, kind: t.kind });
      this.pulled.add(`${t.userId}:${t.kind}`);
    }
    if (ack.requiresRenegotiation && ack.description) {
      await pc.setRemoteDescription(ack.description);
      const answer = await makeAnswer(pc);
      await this.deps.request(E.renegotiate, { callId: call.callId, description: answer });
    }
  }

  private installHandlers(pc: RTCPeerConnection) {
    pc.ontrack = (event) => {
      const who = this.midToPublisher.get(event.transceiver.mid ?? "");
      if (!who || event.track.kind !== "audio") return;
      this.audio.attach(`${who.userId}:${who.kind}`, new MediaStream([event.track]));
    };
    pc.onconnectionstatechange = () => {
      const call = this.deps.getCall();
      if (!call?.callId) return;
      const state = pc.connectionState;
      if (state === "connected") {
        this.deps.patch({ phase: "active", startedAt: call.startedAt ?? Date.now() });
        this.report(call.callId, call.conversationId, "connected");
      } else if (state === "disconnected" || state === "failed") {
        this.report(call.callId, call.conversationId, "reconnecting");
      }
    };
  }

  private report(callId: string, conversationId: string, status: CallStatus) {
    this.deps.request(E.status, { callId, conversationId, status }).catch(() => {});
  }
}
