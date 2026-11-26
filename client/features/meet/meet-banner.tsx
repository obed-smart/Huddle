"use client";

import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

import { useActiveMeets } from "@/stores/active-meets";

/** A bar above the messages when a meeting is live in the open conversation and
    you are not in it, so you can jump straight in, like a call-in-progress bar. */
export function MeetBanner({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const meet = useActiveMeets((s) => s.items.find((m) => m.conversationId === conversationId && !m.scheduledFor));
  if (!meet) return null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/meet/${meet.meetId}?conversationId=${encodeURIComponent(conversationId)}`)}
      className="flex items-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2.5 text-left"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <Video className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          <span className="size-1.5 rounded-full bg-red-500" />
          Meeting in progress
        </p>
        <p className="truncate text-xs text-muted-foreground">{meet.title || "Tap to join"}</p>
      </div>
      <span className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground">Join</span>
    </button>
  );
}
