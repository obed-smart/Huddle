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
