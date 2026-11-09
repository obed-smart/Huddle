"use client";

import { ChevronDown, ShieldCheck } from "lucide-react";

import { useCall } from "./call-store";
import { useCallDuration } from "./use-call-duration";
import { CallAvatar } from "./call-avatar";
import { CallControls } from "./call-controls";
import type { CallPhase } from "./call-types";

/** The branded immersive surface. Independent of light or dark theme on
    purpose, so a call always looks and feels the same calm place. */
const BACKDROP =
  "radial-gradient(120% 85% at 50% 0%, #6f68d8 0%, #4b45a6 45%, #2b2860 100%)";

function statusLabel(phase: CallPhase, duration: string): string {
  if (phase === "outgoing") return "Calling…";
  if (phase === "incoming") return "Incoming audio call";
  if (phase === "connecting") return "Connecting…";
  if (phase === "active") return duration || "Connected";
  return "Call ended";
}

/** The full audio-call experience: portrait, name, live status, and controls. */
export function AudioCallScreen() {
  const call = useCall((s) => s.call);
  const accept = useCall((s) => s.accept);
  const hangUp = useCall((s) => s.hangUp);
  const toggleMute = useCall((s) => s.toggleMute);
  const toggleSpeaker = useCall((s) => s.toggleSpeaker);
  const setMinimized = useCall((s) => s.setMinimized);
  const duration = useCallDuration(call?.startedAt ?? null);

  if (!call) return null;
  const { peer, phase, muted, speaker } = call;
  const pulsing = phase === "outgoing" || phase === "incoming" || phase === "connecting";

  return (
    <div
      className="flex size-full flex-col px-6 pb-10 pt-5 text-white"
      style={{
        background: BACKDROP,
        paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
      }}
    >
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMinimized(true)}
          aria-label="Minimize call"
          className="grid size-10 place-items-center rounded-full text-white/80 outline-none transition-transform duration-150 ease-out hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
        >
          <ChevronDown className="size-6" />
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
          <ShieldCheck className="size-3.5" />
          Audio call
        </span>
        <span className="size-10" aria-hidden />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CallAvatar name={peer.name} src={peer.avatar} pulsing={pulsing} />
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="font-display text-3xl font-bold tracking-tight">{peer.name}</h2>
          <p className="text-base text-white/75 tabular-nums">{statusLabel(phase, duration)}</p>
        </div>
      </div>

      <CallControls
        phase={phase}
        muted={muted}
        speaker={speaker}
        onToggleMute={toggleMute}
        onToggleSpeaker={toggleSpeaker}
        onAccept={accept}
        onHangUp={hangUp}
      />
    </div>
  );
}
