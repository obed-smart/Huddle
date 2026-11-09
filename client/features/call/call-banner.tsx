"use client";

import { PhoneOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { useCall } from "./call-store";
import { useCallDuration } from "./use-call-duration";

/** The collapsed call, a floating pill. The body reopens the full screen; the
    red button hangs up. Positioned and animated by CallRoot. */
export function CallBanner() {
  const call = useCall((s) => s.call);
  const expand = useCall((s) => s.setMinimized);
  const hangUp = useCall((s) => s.hangUp);
  const duration = useCallDuration(call?.startedAt ?? null);

  if (!call) return null;
  const live = call.phase === "active";
  const status = live ? duration || "Connected" : "Calling…";

  return (
    <div className="flex items-center gap-2 rounded-full bg-[#4b45a6] py-1.5 pl-4 pr-1.5 text-white shadow-xl ring-1 ring-white/10">
      <button
        type="button"
        onClick={() => expand(false)}
        aria-label={`Open call with ${call.peer.name}`}
        className="flex items-center gap-2.5 rounded-full pr-1 text-left outline-none transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <span className="relative grid size-2.5 place-items-center">
          <span
            className={cn(
              "absolute inline-flex size-2.5 rounded-full bg-success",
              live && "motion-safe:animate-ping",
            )}
          />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="max-w-40 truncate text-sm font-semibold">{call.peer.name}</span>
          <span className="text-xs text-white/70 tabular-nums">{status}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={hangUp}
        aria-label="End call"
        className="grid size-9 place-items-center rounded-full bg-destructive text-destructive-foreground outline-none transition-transform duration-150 ease-out hover:bg-destructive/90 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 [&_svg]:size-4.5"
      >
        <PhoneOff />
      </button>
    </div>
  );
}
