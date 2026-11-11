"use client";

import { Phone, PhoneOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCall } from "./call-store";
import { callSession } from "./call-session";

const roundBtn =
  "grid size-11 shrink-0 place-items-center rounded-full text-white outline-none transition-transform duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5";

/** An inbound call arrives as a toast, not a full screen, so you can keep
    reading until you answer. Tapping the body expands it to the full call
    screen; accept opens the call; decline clears it. */
export function IncomingToast() {
  const call = useCall((s) => s.call);
  const expand = useCall((s) => s.setMinimized);
  if (!call) return null;
  const label = call.media === "video" ? "Incoming video call" : "Incoming audio call";

  return (
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border bg-card p-2.5 shadow-xl">
      <button
        type="button"
        onClick={() => expand(false)}
        aria-label={`Open incoming call from ${call.peer.name}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left outline-none transition-transform duration-150 ease-out active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Avatar src={call.peer.avatar} name={call.peer.name} className="size-12" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-base font-semibold">{call.peer.name}</span>
          <span className="block truncate text-sm text-muted-foreground">{label}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => callSession.hangUp()}
        aria-label="Decline"
        className={cn(roundBtn, "bg-destructive hover:bg-destructive/90")}
      >
        <PhoneOff />
      </button>
      <button
        type="button"
        onClick={() => callSession.accept()}
        aria-label="Accept"
        className={cn(roundBtn, "bg-success hover:bg-success/90")}
      >
        <Phone />
      </button>
    </div>
  );
}
