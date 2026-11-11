"use client";

import { ArrowDownLeft, ArrowUpRight, Phone, Video } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { callWhen } from "@/lib/time";
import type { CallLogEntry } from "@/lib/api/types";

/** Red only ever means status. An outgoing call that never connected, or an
    incoming one actually missed (a decline is a choice, not a miss). */
function isMissed(e: CallLogEntry): boolean {
  if (e.direction === "outgoing") return e.durationSeconds == null;
  return e.outcome === "missed";
}

type Props = {
  entry: CallLogEntry;
  onOpen: (conversationId: string) => void;
  onRedial: (entry: CallLogEntry) => void;
};

/** One call history row: who, which way it went and when, and a redial button
    carrying the call's own media (audio or video). */
export function CallLogRow({ entry, onOpen, onRedial }: Props) {
  const missed = isMissed(entry);
  const DirIcon = entry.direction === "incoming" ? ArrowDownLeft : ArrowUpRight;
  const RedialIcon = entry.type === "video" ? Video : Phone;
  const others = entry.otherParticipants ?? [];
  const grew = others.length > 1;
  const count = entry.count > 1 ? ` (${entry.count})` : "";

  return (
    <div className="flex w-full items-center gap-1 px-1">
      <button
        type="button"
        onClick={() => onOpen(entry.conversationId)}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary active:scale-[0.99]"
      >
        {grew ? (
          <StackedAvatars people={others} />
        ) : (
          <Avatar src={entry.avatarUrl} name={entry.label} className="size-11" />
        )}
        <span className="min-w-0 flex-1">
          <span className={cn("block truncate text-sm font-semibold", missed && "text-destructive")}>
            {entry.label}
            {count}
          </span>
          <span className={cn("flex items-center gap-1.5 text-xs", missed ? "text-destructive" : "text-muted-foreground")}>
            <DirIcon className="size-3.5 shrink-0" />
            <span className="truncate">{callWhen(entry.callStartedAt)}</span>
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onRedial(entry)}
        aria-label="Call again"
        className="grid size-9 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-secondary active:scale-95"
      >
        <RedialIcon className="size-4.5" />
      </button>
    </div>
  );
}

/** Two overlapping avatars for a call that outgrew its conversation. */
function StackedAvatars({ people }: { people: CallLogEntry["otherParticipants"] }) {
  return (
    <span className="relative block size-11 shrink-0">
      <Avatar
        src={people[1]?.avatarUrl}
        name={people[1]?.username ?? "?"}
        className="absolute left-0 top-0 size-8 text-xs"
      />
      <Avatar
        src={people[0]?.avatarUrl}
        name={people[0]?.username ?? "?"}
        className="absolute bottom-0 right-0 size-8 text-xs ring-2 ring-background"
      />
    </span>
  );
}
