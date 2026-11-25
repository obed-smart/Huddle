import { toast } from "@/lib/notify";
import { useMeet } from "./meet-store";
import { meetSignaling } from "./meet-signaling";

/** The local media for a meet: camera and mic for the lobby preview and the
    self tile, plus screen sharing. Signaling (publish/subscribe over the SFU)
    plugs in on top of this later; this layer only owns our own devices. */
class MeetMedia {
  private stream: MediaStream | null = null;
  private camTrack: MediaStreamTrack | null = null;
  private screen: MediaStream | null = null;

  /** Open camera and mic for the preview. Falls back to mic only, then to
      nothing, so the lobby still works without a camera. */
  async open() {
    if (this.stream) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        useMeet.getState().setCam(false);
      } catch {
        this.stream = null;
        useMeet.getState().setCam(false);
      }
    }
    this.camTrack = this.stream?.getVideoTracks()[0] ?? null;
    this.applyFlags();
    useMeet.getState().setLocal(this.stream);
  }

  private applyFlags() {
    const { mic, cam } = useMeet.getState();
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = mic));
    this.stream?.getVideoTracks().forEach((t) => (t.enabled = cam));
  }

  toggleMic() {
    const on = !useMeet.getState().mic;
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = on));
    useMeet.getState().setMic(on);
  }

  toggleCam() {
    const on = !useMeet.getState().cam;
    this.stream?.getVideoTracks().forEach((t) => (t.enabled = on));
    useMeet.getState().setCam(on);
  }

  /** Start or stop screen sharing. The shared surface replaces our camera in
      the self tile; ending it (here or from the browser bar) restores the
      camera. */
  async toggleShare() {
    if (useMeet.getState().sharing) return this.stopShare();
    try {
      this.screen = await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      return;
    }
    const screenTrack = this.screen.getVideoTracks()[0];
    screenTrack.addEventListener("ended", () => this.stopShare());
    this.swapVideo(screenTrack);
    useMeet.getState().setSharing(true);
  }

  private stopShare() {
    this.screen?.getTracks().forEach((t) => t.stop());
    this.screen = null;
    if (this.camTrack) this.swapVideo(this.camTrack);
    useMeet.getState().setSharing(false);
  }

  /** Put a track into the local stream as its only video, publish the new
      stream object so the self tile re-renders, and hand it to the SFU sender so
      everyone else sees the change too. */
  private swapVideo(track: MediaStreamTrack) {
    if (!this.stream) this.stream = new MediaStream();
    this.stream.getVideoTracks().forEach((t) => this.stream?.removeTrack(t));
    this.stream.addTrack(track);
    useMeet.getState().setLocal(new MediaStream(this.stream.getTracks()));
    meetSignaling.replaceVideo(track);
  }

  leave() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.screen?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.screen = null;
    this.camTrack = null;
    useMeet.getState().reset();
  }
}

export const meetMedia = new MeetMedia();

/** Guard getUserMedia behind a secure context, with a friendly message. */
export function mediaSupported() {
  const md = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
  if (md && typeof md.getUserMedia === "function") return true;
  toast("A meeting needs a secure connection (https or localhost).");
  return false;
}
