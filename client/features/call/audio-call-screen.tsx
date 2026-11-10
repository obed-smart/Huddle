"use client";

import { useEffect } from "react";
import { ChevronDown, ShieldCheck, UserPlus } from "lucide-react";

import { toast } from "@/lib/notify";
import { useCall } from "./call-store";
import { callSession } from "./call-session";
import { CallAvatar } from "./call-avatar";
import { CallControls } from "./call-controls";
import { CallStatus } from "./call-status";

/** The branded immersive surface. Independent of light or dark theme on
    purpose, so a call always looks and feels the same calm place. */
const BACKDROP =
  "radial-gradient(120% 85% at 50% 0%, #6f68d8 0%, #4b45a6 45%, #2b2860 100%)";

/** The full audio-call experience: portrait, name, live status, and controls. */
export function AudioCallScreen() {
  const call = useCall((s) => s.call);
  const setMinimized = useCall((s) => s.setMinimized);
  const phase = call?.phase;

  // Escape tucks the call into the pill. Never on an incoming call, where the
  // choice to answer or decline has to be deliberate.
  useEffect(() => {
    if (!phase || phase === "incoming") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMinimized(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, setMinimized]);

  if (!call) return null;
  const { peer, muted, speaker } = call;
  const ringing = call.phase === "outgoing" || call.phase === "incoming" || call.phase === "connecting";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Audio call with ${peer.name}`}
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
        {call.phase === "incoming" ? (
          <span className="size-10" aria-hidden />
        ) : (
          <button
            type="button"
            onClick={() => toast("Inviting people is coming soon.")}
            aria-label="Add person"
            className="grid size-10 place-items-center rounded-full text-white/80 outline-none transition-transform duration-150 ease-out hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <UserPlus className="size-5.5" />
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <CallAvatar name={peer.name} src={peer.avatar} pulsing={ringing} />
        <div className="flex flex-col items-center gap-1.5">
          <h2 className="font-display text-3xl font-bold tracking-tight">{peer.name}</h2>
          <CallStatus phase={call.phase} startedAt={call.startedAt} />
        </div>
      </div>

      <CallControls
        phase={call.phase}
        muted={muted}
        speaker={speaker}
        onToggleMute={() => callSession.setMuted(!muted)}
        onToggleSpeaker={() => callSession.setSpeaker(!speaker)}
        onAccept={() => callSession.accept()}
        onHangUp={() => callSession.hangUp()}
      />
    </div>
  );
}
