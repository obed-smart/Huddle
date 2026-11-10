import { create } from "zustand";

import type { CallSnapshot } from "./call-types";

/**
 * Pure call state for the UI. The media path and signaling live in the call
 * session (call-session.ts), which drives this store through these setters.
 * Components read `call` to render, and call the session for intents.
 */
type CallStore = {
  call: CallSnapshot | null;
  /** Replace the whole call (start one, or clear with null). */
  setCall: (call: CallSnapshot | null) => void;
  /** Merge a change into the live call (phase, muted, startedAt, ...). */
  patch: (partial: Partial<CallSnapshot>) => void;
  setMinimized: (minimized: boolean) => void;
};

export const useCall = create<CallStore>((set) => ({
  call: null,
  setCall: (call) => set({ call }),
  patch: (partial) => set((s) => (s.call ? { call: { ...s.call, ...partial } } : s)),
  setMinimized: (minimized) =>
    set((s) => (s.call ? { call: { ...s.call, minimized } } : s)),
}));
