"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversations } from "@/stores/conversations";
import { ConversationRow } from "./conversation-row";
import type { ConversationFilter } from "./conversation-tabs";

type Props = {
  filter: ConversationFilter;
  query: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ConversationList({ filter, query, selectedId, onSelect }: Props) {
  const { items, status, error, unread, load } = useConversations();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((c) => {
      if (filter === "groups" && c.type !== "group") return false;
      if (filter === "unread" && !((unread[c.id] ?? 0) > 0)) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, filter, query, unread]);

  if (status === "idle" || status === "loading") return <ListSkeleton />;

  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="soft" size="sm" onClick={() => load()}>
          Try again
        </Button>
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-muted-foreground">
        {query.trim()
          ? "No conversations match that."
          : filter === "unread"
            ? "You're all caught up."
            : filter === "groups"
              ? "No groups yet."
              : "No conversations yet."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {visible.map((c) => (
        <ConversationRow
          key={c.id}
          conversation={c}
          unread={unread[c.id] ?? 0}
          selected={c.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-1 p-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
