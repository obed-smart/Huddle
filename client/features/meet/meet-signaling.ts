import type { Socket } from "socket.io-client";

import { useSession } from "@/stores/session";
import { makeOffer, makeAnswer, trackKind } from "@/features/call/call-rtc";
import { RemoteAudio } from "@/features/call/call-audio";
import { useMeet } from "./meet-store";
import { applyRoster, putRemote, dropRemote, clearRoster } from "./meet-roster";
import { MEET_EVENTS as E } from "./signaling/events";
import type {
  JoinAck, NewCloseEvt, NewJoinEvt, NewLeaveEvt, NewPublishEvt, PublishAck,
  RosterEvt, SubscribeAck, SubscribeTarget,
} from "./signaling/types";

const ACK_TIMEOUT = 15000;
type Listener = (data: unknown) => void;

/** The meet's SFU media plane: one peer connection that publishes our tracks
    and pulls everyone else's, the same shape as the call, keyed by userId. */
class MeetSignaling {
  private socket: Socket | null = null;
  private pc: RTCPeerConnection | null = null;
  private iceServers: RTCIceServer[] = [];
  private meetId = "";
  private conversationId = "";
  private myId = "";
  private bound: Array<[string, Listener]> = [];
  private midToPub = new Map<string, { userId: string; kind: string }>();
  private pulled = new Set<string>();
  private pending: SubscribeTarget[] = [];
  private published = false;
  private reported = false;
  private chain: Promise<void> = Promise.resolve();
  private audio = new RemoteAudio();

  attach(socket: Socket) {
    if (this.socket === socket) return;
    this.detach();
    this.socket = socket;
    this.on(E.newJoin, (d) => this.onNewJoin(d as NewJoinEvt));
    this.on(E.newPublish, (d) => this.onNewPublish(d as NewPublishEvt));
    this.on(E.newClose, (d) => this.onNewClose(d as NewCloseEvt));
    this.on(E.newRoster, (d) => applyRoster((d as RosterEvt).participants ?? [], this.myId));
    this.on(E.newLeave, (d) => this.onNewLeave(d as NewLeaveEvt));
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
    this.myId = useSession.getState().user?.id ?? "";
    try {
      const ack = await this.request<JoinAck>(E.join, { meetId, conversationId });
      if (!ack?.success) return;
      this.iceServers = ack.iceServers ?? [];
      applyRoster(ack.participants ?? [], this.myId);
      await this.publish(local);
    } catch {
      // A failed join leaves the lobby preview up; the user can retry.
    }
  }

  private async publish(local: MediaStream, retried = false): Promise<void> {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    this.pc = pc;
    this.installHandlers(pc);
    const txs = local.getTracks().map((t) => pc.addTransceiver(t, { direction: "sendonly" }));
    const description = await makeOffer(pc);
    const tracks = txs
      .filter((t) => t.sender.track && t.mid)
      .map((t) => ({ mid: t.mid as string, kind: trackKind(t.sender.track as MediaStreamTrack) }));
    const ack = await this.request<PublishAck>(E.publish, { meetId: this.meetId, description, tracks });
    if (!ack?.success) {
      pc.close();
      this.pc = null;
      if (ack?.reason === "session_expired" && !retried) return this.publish(local, true);
      return;
    }
    if (ack.description) await pc.setRemoteDescription(ack.description);
    this.published = true;
    const first = [...(ack.existing ?? []), ...this.pending];
    this.pending = [];
    if (first.length) this.enqueue(() => this.subscribe(first));
  }

  private onNewPublish(d: NewPublishEvt) {
    if (d.meetId !== this.meetId || d.userId === this.myId) return;
    const target: SubscribeTarget = { userId: d.userId, kinds: d.tracks.map((t) => t.kind) };
    if (!this.published) this.pending.push(target);
    else this.enqueue(() => this.subscribe([target]));
  }

  private async subscribe(targets: SubscribeTarget[]) {
    const pc = this.pc;
    if (!pc) return;
    const fresh = targets
      .map((t) => ({ userId: t.userId, kinds: (t.kinds ?? []).filter((k) => !this.pulled.has(`${t.userId}:${k}`)) }))
      .filter((t) => t.kinds.length > 0);
    if (!fresh.length) return;
    const ack = await this.request<SubscribeAck>(E.subscribe, { meetId: this.meetId, targets: fresh });
    if (!ack?.success) return;
    for (const t of ack.subscribed) {
      this.midToPub.set(t.mid, { userId: t.userId, kind: t.kind });
      this.pulled.add(`${t.userId}:${t.kind}`);
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
      if (event.track.kind === "audio") this.audio.attach(`${who.userId}:${who.kind}`, stream);
      else putRemote(who.userId, { stream, camOn: true });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected" && !this.reported) {
        this.reported = true;
        this.request(E.connected, { meetId: this.meetId, conversationId: this.conversationId }).catch(() => {});
      }
    };
  }

  private onNewJoin(d: NewJoinEvt) {
    if (d.meetId === this.meetId && d.participant) applyRoster([d.participant], this.myId);
  }

  /** A peer turned a track off: drop it, and a closed camera shows their avatar. */
  private onNewClose(d: NewCloseEvt) {
    if (d.meetId !== this.meetId) return;
    for (const kind of d.kinds) {
      this.pulled.delete(`${d.userId}:${kind}`);
      for (const [mid, w] of this.midToPub) if (w.userId === d.userId && w.kind === kind) this.midToPub.delete(mid);
    }
    if (d.kinds.includes("cam") || d.kinds.includes("screen")) putRemote(d.userId, { stream: null, camOn: false });
  }

  private onNewLeave(d: NewLeaveEvt) {
    const who = d.userId ?? d.from;
    if (!who) return;
    for (const [mid, w] of this.midToPub) if (w.userId === who) this.midToPub.delete(mid);
    dropRemote(who);
  }
  /** Swap the video sender's track (camera to screen and back) without renegotiating. */
  replaceVideo(track: MediaStreamTrack | null) {
    void this.pc?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(track);
  }
  /** Reactions are local only until the backend's meet:send data channel lands. */
  react(emoji: string) {
    useMeet.getState().react(emoji, "You");
  }

  leave() {
    if (this.pc) this.request(E.leave, { meetId: this.meetId, conversationId: this.conversationId }).catch(() => {});
    if (this.pc) {
      this.pc.ontrack = null;
      this.pc.onconnectionstatechange = null;
      this.pc.close();
    }
    this.pc = null;
    this.audio.clear();
    clearRoster();
    this.midToPub.clear();
    this.pulled.clear();
    this.pending = [];
    this.published = false;
    this.reported = false;
    this.chain = Promise.resolve();
    this.myId = "";
  }

  private enqueue(op: () => Promise<void>) {
    this.chain = this.chain.then(op).catch(() => {});
  }
}

export const meetSignaling = new MeetSignaling();
