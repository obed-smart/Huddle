"use client";

import { useCallDuration } from "./use-call-duration";
import type { CallPhase } from "./call-types";

function label(phase: CallPhase, duration: string): string {
  if (phase === "outgoing") return "Calling…";
  if (phase === "incoming") return "Incoming audio call";
  if (phase === "connecting") return "Connecting…";
  if (phase === "active") return duration || "Connected";
  return "Call ended";
}

/** The status line under the name. Isolated so the once-a-second timer tick
    re-renders only this line, not the whole call screen. */
export function CallStatus({ phase, startedAt }: { phase: CallPhase; startedAt: number | null }) {
  const duration = useCallDuration(startedAt);
  return <p className="text-base text-white/75 tabular-nums">{label(phase, duration)}</p>;
}
