"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Video, Loader2 } from "lucide-react";

import { useActiveMeets } from "@/stores/active-meets";
import { useConversations } from "@/stores/conversations";
import type { Meet } from "@/lib/api/meet";

function when(scheduledFor?: string | number | null) {
  if (!scheduledFor) return "Live now";
  const d = new Date(scheduledFor);
  return Number.isNaN(d.getTime())
    ? "Scheduled"
    : `Scheduled ${d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}`;
}

/** The Meet tab's list: meetings running or scheduled in your conversations
    that you can join. Join opens the room (via its lobby). */
export function MeetList() {
  const router = useRouter();
  const items = useActiveMeets((s) => s.items);
  const status = useActiveMeets((s) => s.status);
  const conversations = useConversations((s) => s.items);

  function join(m: Meet) {
    router.push(`/meet/${m.meetId}?conversationId=${encodeURIComponent(m.conversationId)}`);
  }

  if (status === "loading" && !items.length) return <Hint><Loader2 className="mx-auto size-5 animate-spin" /></Hint>;
  if (!items.length) return <Hint>No meetings right now.</Hint>;

  return (
    <div className="p-2">
      {items.map((m) => {
        const name = m.title || conversations.find((c) => c.id === m.conversationId)?.name || "Meeting";
        const live = !m.scheduledFor;
        return (
          <div key={m.meetId} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Video className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                {live ? <span className="size-1.5 shrink-0 rounded-full bg-red-500" /> : null}
                {when(m.scheduledFor)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => join(m)}
              className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-transform active:scale-95"
            >
              Join
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <div className="px-4 py-10 text-center text-sm text-muted-foreground">{children}</div>;
}
