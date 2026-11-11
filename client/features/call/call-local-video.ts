import { toast } from "@/lib/notify";
import { useSession } from "@/stores/session";
import { makeOffer, trackKind } from "./call-rtc";
import { useCallStreams } from "./call-streams";
import { CALL_EVENTS as E } from "./signaling/events";
import type { PublishAck } from "./signaling/types";
import type { MediaDeps } from "./call-media";

/** What local video needs from the media plane: the live connection and our
    outgoing stream, the backend channel, and a way to run one SDP exchange on
    the media plane's single queue. */
export type VideoCtx = {
  pc: () => RTCPeerConnection | null;
  stream: () => MediaStream | null;
  deps: MediaDeps;
  run: <T>(op: () => Promise<T>) => Promise<T>;
};

/** The outgoing camera: turning an audio call into a video one, and flipping
    between the front and rear camera. The audio plane and the remote pulls stay
    in CallMedia; this only ever touches our own video. */
export class LocalVideo {
  private facing: "user" | "environment" = "user";

  constructor(private ctx: VideoCtx) {}

  reset() {
    this.facing = "user";
  }

  /** Whether we are already publishing a camera track. */
  hasVideo() {
    return (this.ctx.stream()?.getVideoTracks().length ?? 0) > 0;
  }

  /** Turn our camera fully off: stop the track and tell the backend to close it
      at Cloudflare, so it stops sending our video and no bandwidth is wasted.
      Turning the camera back on re-publishes through upgrade(). */
  async stop() {
    const stream = this.ctx.stream();
    const track = stream?.getVideoTracks()[0];
    if (!stream || !track) return;
    await this.ctx.pc()?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(null);
    stream.removeTrack(track);
    track.stop();
    useCallStreams.getState().setLocal(new MediaStream(stream.getTracks()));
    const call = this.ctx.deps.getCall();
    const userId = useSession.getState().user?.id;
    if (call?.callId && userId) {
      void this.ctx.deps.request(E.close, {
        callId: call.callId,
        conversationId: call.conversationId,
        userId,
        kind: "cam",
      });
    }
  }

  /** Front to rear and back: replace the track on the live sender, which needs
      no renegotiation, so the call keeps running. */
  async flip() {
    const pc = this.ctx.pc();
    const stream = this.ctx.stream();
    const sender = pc?.getSenders().find((s) => s.track?.kind === "video");
    if (!pc || !stream || !sender) return;
    const facing = this.facing === "user" ? "environment" : "user";
    const next = await this.camera(facing);
    if (!next) return;
    next.enabled = this.ctx.deps.getCall()?.camOn ?? true;
    await sender.replaceTrack(next);
    const old = stream.getVideoTracks()[0];
    if (old) {
      stream.removeTrack(old);
      old.stop();
    }
    stream.addTrack(next);
    this.facing = facing;
    useCallStreams.getState().setLocal(new MediaStream(stream.getTracks()));
  }

  /** Publish our camera: add a cam track and re-publish. The backend publishes
      it and tells the other side, which pulls it and renegotiates, so our video
      shows up for them. Used to upgrade an audio call and to turn a camera on. */
  async upgrade() {
    const pc = this.ctx.pc();
    const stream = this.ctx.stream();
    const call = this.ctx.deps.getCall();
    if (!pc || !stream || !call?.callId) return;
    if (stream.getVideoTracks().length > 0) return; // already publishing a camera
    const track = await this.camera();
    if (!track) return;
    const tx = pc.addTransceiver(track, { direction: "sendonly" });
    await this.ctx.run(async () => {
      if (!tx.mid) return track.stop();
      const description = await makeOffer(pc);
      const ack = await this.ctx.deps.request<PublishAck>(E.publish, {
        callId: call.callId,
        description,
        tracks: [{ mid: tx.mid, kind: trackKind(track) }],
      });
      if (!ack?.success) return track.stop();
      await pc.setRemoteDescription(ack.description);
      stream.addTrack(track);
      useCallStreams.getState().setLocal(new MediaStream(stream.getTracks()));
      this.ctx.deps.patch({ media: "video", camOn: true });
    });
  }

  private async camera(facing?: "user" | "environment"): Promise<MediaStreamTrack | null> {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast("The camera needs a secure connection (https or localhost).");
      return null;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: facing ? { facingMode: facing } : true });
      return s.getVideoTracks()[0] ?? null;
    } catch {
      toast("Could not open the camera.");
      return null;
    }
  }
}
