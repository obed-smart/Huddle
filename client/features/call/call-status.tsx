"use client";

import { useCallDuration } from "./use-call-duration";
import type { CallMedia, CallPhase } from "./call-types";

function label(phase: CallPhase, duration: string, media: CallMedia): string {
  if (phase === "outgoing") return "Calling…";
  if (phase === "incoming") return `Incoming ${media === "video" ? "video" : "audio"} call`;
  if (phase === "connecting") return "Connecting…";
  if (phase === "active") return duration || "Connected";
  return "Call ended";
}

/** The status line under the name. Isolated so the once-a-second timer tick
    re-renders only this line, not the whole call screen. */
export function CallStatus({ phase, startedAt, media = "audio" }: { phase: CallPhase; startedAt: number | null; media?: CallMedia }) {
  const duration = useCallDuration(startedAt);
  return <p className="text-base text-white/75 tabular-nums">{label(phase, duration, media)}</p>;
}
