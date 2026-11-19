import type { RtcDescription, TrackKind } from "./signaling/types";

/**
 * Resolve once ICE gathering is complete, so we send one full SDP with all
 * candidates in it (no trickle). "complete" occasionally never fires, so a
 * short timeout backs it up.
 */
export function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
  if (pc.iceGatheringState === "complete") return Promise.resolve();
  return new Promise((resolve) => {
    const check = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", check);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", check);
    setTimeout(resolve, 2000);
  });
}

/** Our semantic kind from a raw media track: a camera track is "cam", audio is
    "mic". Screen shares are tagged at the call site, not here. */
export function trackKind(track: MediaStreamTrack): TrackKind {
  return track.kind === "video" ? "cam" : "mic";
}

/** Open our mic, and the camera too for a video call. When the camera cannot be
    opened (no camera, it is in use, or it was blocked), a video call falls back
    to voice alone and calls onNoCamera, rather than publishing an empty video
    track or failing the whole call. If the mic cannot be opened either, it
    throws, and the caller treats that as a real failure. */
export async function openLocal(wantVideo: boolean, onNoCamera: () => void): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: wantVideo });
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    const cameraProblem =
      name === "NotFoundError" || name === "NotReadableError" || name === "OverconstrainedError" || name === "NotAllowedError";
    if (!wantVideo || !cameraProblem) throw err;
    onNoCamera();
    return navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  }
}

/** Create the local offer and wait for ICE, ready to send to the backend. */
export async function makeOffer(pc: RTCPeerConnection): Promise<RtcDescription> {
  await pc.setLocalDescription(await pc.createOffer());
  await waitForIceGathering(pc);
  return { type: "offer", sdp: pc.localDescription?.sdp ?? "" };
}

/** Answer an offer the SFU sent us and wait for ICE. */
export async function makeAnswer(pc: RTCPeerConnection): Promise<RtcDescription> {
  await pc.setLocalDescription(await pc.createAnswer());
  await waitForIceGathering(pc);
  return { type: "answer", sdp: pc.localDescription?.sdp ?? "" };
}
