import type { Socket } from "socket.io-client";

import { makeOffer, makeAnswer, trackKind } from "@/features/call/call-rtc";
import { RemoteAudio } from "@/features/call/call-audio";
import { useMeet, type MeetParticipant } from "./meet-store";
import { MEET_EVENTS as E } from "./signaling/events";
import type {
  JoinAck, MeetParticipantWire, NewJoinEvt, NewLeaveEvt, NewPublishEvt, NewReactionEvt,
  PublishAck, SubscribeAck, SubscribeTarget,
} from "./signaling/types";

const ACK_TIMEOUT = 15000;
type Listener = (data: unknown) => void;

/** The meet's SFU media plane: one peer connection that publishes our tracks
    and pulls everyone else's, the same shape as the call. Participants are keyed
    by sessionId. Remote streams and names land in the meet store. */
class MeetSignaling {
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private iceServers: RTCIceServer[] = [];
  private meetId = "";
  private conversationId = "";
  private mySession = "";
  private bound: Array<[string, Listener]> = [];
  private midToPub = new Map<string, { sessionId: string; kind: string }>();
  private pulled = new Set<string>();
  private pending: SubscribeTarget[] = [];
  private published = false;
  private chain: Promise<void> = Promise.resolve();
  private names = new Map<string, { name: string; avatar: string | null }>();
  private audio = new RemoteAudio();

  attach(socket: Socket) {
    if (this.socket === socket) return;
    this.detach();
    this.socket = socket;
    this.on(E.newJoin, (d) => this.onNewJoin(d as NewJoinEvt));
    this.on(E.newPublish, (d) => this.onNewPublish(d as NewPublishEvt));
    this.on(E.newLeave, (d) => this.onNewLeave(d as NewLeaveEvt));
    this.on(E.newReaction, (d) => this.onReaction(d as NewReactionEvt));
  }

  detach() {
    for (const [event, fn] of this.bound) this.socket?.off(event, fn);
    this.bound = [];
    this.socket = null;
  }

  private on(event: string, fn: Listener) {
    this.socket?.on(event, fn);
    this.bound.push([event, fn]);
  }

  private request<T>(event: string, payload: unknown): Promise<T> {
    if (!this.socket) return Promise.reject(new Error("meet socket is not connected"));
    return this.socket.timeout(ACK_TIMEOUT).emitWithAck(event, payload) as Promise<T>;
  }

  /** Join the meet, then publish our stream and pull whoever is already here. */
  async join(meetId: string, conversationId: string) {
    const local = useMeet.getState().local;
    if (!local || this.pc) return;
    this.meetId = meetId;
    this.conversationId = conversationId;
    try {
      const ack = await this.request<JoinAck>(E.join, { meetId, conversationId });
      if (!ack?.success || !ack.data) return;
      this.mySession = ack.data.sessionId;
      this.iceServers = ack.data.iceServers ?? [];
      this.register(ack.data.participants ?? []);
      await this.publish(local);
    } catch {
      // A failed join leaves the lobby's local preview up; the user can retry.
    }
  }

  private async publish(local: MediaStream) {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.pc = pc;
    this.installHandlers(pc);
    const txs = local.getTracks().map((t) => pc.addTransceiver(t, { direction: "sendonly" }));
    const description = await makeOffer(pc);
    const tracks = txs
      .filter((t) => t.sender.track && t.mid)
      .map((t) => ({ mid: t.mid as string, kind: trackKind(t.sender.track as MediaStreamTrack) }));
    const ack = await this.request<PublishAck>(E.publish, { meetId: this.meetId, description, tracks });
    if (!ack?.success) return;
    await pc.setRemoteDescription(ack.description);
    this.published = true;
    const first = [...(ack.existing ?? []), ...this.pending];
    this.pending = [];
    if (first.length) this.enqueue(() => this.subscribe(first));
  }

  private onNewPublish(d: NewPublishEvt) {
    if (d.meetId !== this.meetId || d.sessionId === this.mySession) return;
    const target: SubscribeTarget = { sessionId: d.sessionId, kinds: d.tracks.map((t) => t.kind) };
    if (!this.published) this.pending.push(target);
    else this.enqueue(() => this.subscribe([target]));
  }

  private async subscribe(targets: SubscribeTarget[]) {
    const pc = this.pc;
    if (!pc) return;
    const fresh = targets
      .map((t) => ({ sessionId: t.sessionId, kinds: (t.kinds ?? []).filter((k) => !this.pulled.has(`${t.sessionId}:${k}`)) }))
      .filter((t) => t.kinds.length > 0);
    if (!fresh.length) return;
    const ack = await this.request<SubscribeAck>(E.subscribe, { meetId: this.meetId, targets: fresh });
    if (!ack?.success) return;
    for (const t of ack.subscribed) {
      this.midToPub.set(t.mid, { sessionId: t.sessionId, kind: t.kind });
      this.pulled.add(`${t.sessionId}:${t.kind}`);
    }
    if (ack.requiresRenegotiation && ack.description) {
      await pc.setRemoteDescription(ack.description);
      const answer = await makeAnswer(pc);
      await this.request(E.renegotiate, { meetId: this.meetId, description: answer });
    }
  }

  private installHandlers(pc: RTCPeerConnection) {
    pc.ontrack = (event) => {
      const who = this.midToPub.get(event.transceiver.mid ?? "");
      if (!who) return;
      const stream = new MediaStream([event.track]);
      if (event.track.kind === "audio") this.audio.attach(`${who.sessionId}:${who.kind}`, stream);
      else this.putRemote(who.sessionId, { stream, camOn: true });
    };
  }

  private register(ps: MeetParticipantWire[]) {
    for (const p of ps) {
      if (p.sessionId === this.mySession) continue;
      this.names.set(p.sessionId, { name: p.name, avatar: p.avatarUrl ?? null });
      this.putRemote(p.sessionId, { micOn: p.audioOn ?? true, camOn: p.videoOn ?? false });
    }
  }

  /** Merge a change into a remote participant, keeping their existing stream. */
  private putRemote(sessionId: string, patch: Partial<MeetParticipant>) {
    const prev = useMeet.getState().remotes.find((r) => r.id === sessionId);
    const known = this.names.get(sessionId);
    useMeet.getState().upsertRemote({
      id: sessionId,
      name: patch.name ?? prev?.name ?? known?.name ?? "",
      avatar: patch.avatar ?? prev?.avatar ?? known?.avatar ?? null,
      stream: patch.stream !== undefined ? patch.stream : prev?.stream ?? null,
      micOn: patch.micOn ?? prev?.micOn ?? true,
      camOn: patch.camOn ?? prev?.camOn ?? false,
    });
  }

  private onNewJoin(d: NewJoinEvt) {
    if (d.meetId === this.meetId) this.register([d.participant]);
  }
  private onNewLeave(d: NewLeaveEvt) {
    if (d.meetId !== this.meetId) return;
    this.names.delete(d.from);
    for (const [mid, w] of this.midToPub) if (w.sessionId === d.from) this.midToPub.delete(mid);
    this.pulled.forEach((k) => k.startsWith(`${d.from}:`) && this.pulled.delete(k));
    useMeet.getState().removeRemote(d.from);
  }
  private onReaction(d: NewReactionEvt) {
    useMeet.getState().react(d.emoji, d.name || this.names.get(d.from)?.name || "Someone");
  }

  /** Float a reaction locally and, once joined, send it to everyone. */
  react(emoji: string) {
    useMeet.getState().react(emoji, "You");
    if (this.pc) void this.request(E.reaction, { meetId: this.meetId, emoji }).catch(() => {});
  }

  leave() {
    if (this.pc) this.request(E.leave, { meetId: this.meetId, conversationId: this.conversationId }).catch(() => {});
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.close();
    }
    this.pc = null;
    this.audio.clear();
    this.midToPub.clear();
    this.pulled.clear();
    this.names.clear();
    this.pending = [];
    this.published = false;
    this.chain = Promise.resolve();
    this.mySession = "";
  }

  private enqueue(op: () => Promise<void>) {
    this.chain = this.chain.then(op).catch(() => {});
  }
}

export const meetSignaling = new MeetSignaling();
