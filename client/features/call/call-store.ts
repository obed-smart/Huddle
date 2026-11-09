import { create } from "zustand";

import { ensureWebrtcAdapter } from "@/lib/webrtc/adapter";
import type { CallMedia, CallPeer, CallPhase, CallSnapshot } from "./call-types";

/**
 * The single source of truth for the one call the UI shows at a time.
 *
 * This layer is pure UI state. The media path (getUserMedia, the peer
 * connection, the Cloudflare Realtime SFU, and the socket signaling that
 * drives inbound calls) plugs into these same actions later. Each seam is
 * marked, so wiring the backend means filling the gaps, not reshaping state.
 */
type CallStore = {
  call: CallSnapshot | null;

  /** We are placing a call to this peer. */
  place: (peer: CallPeer, media?: CallMedia) => void;
  /** An inbound call arrived (driven by the socket once signaling lands). */
  ring: (peer: CallPeer, media?: CallMedia) => void;
  /** Answer an incoming call. */
  accept: () => void;
  /** Decline, cancel, or hang up: all of them clear the call. */
  hangUp: () => void;

  toggleMute: () => void;
  toggleSpeaker: () => void;
  /** Move the lifecycle forward (the signaling layer calls this). */
  setPhase: (phase: CallPhase) => void;
  setMinimized: (minimized: boolean) => void;
};

function freshCall(peer: CallPeer, media: CallMedia, phase: CallPhase): CallSnapshot {
  return {
    peer,
    media,
    phase,
    muted: false,
    speaker: true,
    minimized: false,
    startedAt: null,
  };
}

export const useCall = create<CallStore>((set, get) => ({
  call: null,

  place: (peer, media = "audio") => {
    // Warm the WebRTC shims now, so the peer connection the signaling layer
    // opens next already has the normalized globals in place.
    void ensureWebrtcAdapter();
    set({ call: freshCall(peer, media, "outgoing") });
  },

  ring: (peer, media = "audio") => {
    void ensureWebrtcAdapter();
    set({ call: freshCall(peer, media, "incoming") });
  },

  accept: () => {
    const current = get().call;
    if (!current) return;
    void ensureWebrtcAdapter();
    // Real flow: set "connecting" here, then "active" when the SFU reports the
    // tracks are flowing. Without a backend we connect straight away so the
    // call screen and its timer are usable on their own.
    set({ call: { ...current, phase: "active", startedAt: Date.now() } });
  },

  hangUp: () => set({ call: null }),

  toggleMute: () =>
    set((s) => (s.call ? { call: { ...s.call, muted: !s.call.muted } } : s)),

  toggleSpeaker: () =>
    set((s) => (s.call ? { call: { ...s.call, speaker: !s.call.speaker } } : s)),

  setPhase: (phase) =>
    set((s) => {
      if (!s.call) return s;
      const startedAt =
        phase === "active" && s.call.startedAt == null ? Date.now() : s.call.startedAt;
      return { call: { ...s.call, phase, startedAt } };
    }),

  setMinimized: (minimized) =>
    set((s) => (s.call ? { call: { ...s.call, minimized } } : s)),
}));
