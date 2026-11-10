"use client";

import { Phone, PhoneOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useCall } from "./call-store";
import { callSession } from "./call-session";

const roundBtn =
  "grid size-11 shrink-0 place-items-center rounded-full text-white outline-none transition-transform duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-5";

/** An inbound call arrives as a toast, not a full screen, so you can keep
    reading until you answer. Accept opens the call; decline clears it. */
export function IncomingToast() {
  const call = useCall((s) => s.call);
  if (!call) return null;
  const label = call.media === "video" ? "Incoming video call" : "Incoming audio call";

  return (
    <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border bg-card p-2.5 shadow-xl">
      <Avatar src={call.peer.avatar} name={call.peer.name} className="size-12" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-semibold">{call.peer.name}</p>
        <p className="truncate text-sm text-muted-foreground">{label}</p>
      </div>
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
