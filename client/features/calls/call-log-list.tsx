"use client";

import type { ReactNode } from "react";

import type { CallLogEntry } from "@/lib/api/types";
import { useCallLog } from "./use-call-log";
import { CallLogRow } from "./call-log-row";

type Props = {
  onOpen: (conversationId: string) => void;
  onRedial: (entry: CallLogEntry) => void;
};

/** The Calls section: the call history, in the order the server sent it. */
export function CallLogList({ onOpen, onRedial }: Props) {
  const { entries, status, error } = useCallLog();

  if (status === "loading") return <Centered>Loading your calls…</Centered>;
  if (status === "error") return <Centered>{error}</Centered>;
  if (entries.length === 0) return <Centered>No calls yet.</Centered>;

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {entries.map((entry, i) => (
        <CallLogRow
          key={`${entry.conversationId}-${entry.callStartedAt}-${i}`}
          entry={entry}
          onOpen={onOpen}
          onRedial={onRedial}
        />
      ))}
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return <p className="p-8 text-center text-sm text-muted-foreground">{children}</p>;
}
