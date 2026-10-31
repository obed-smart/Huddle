"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useConversations } from "@/stores/conversations";
import { ConversationPanel } from "@/features/conversations/conversation-panel";
import { NavRail } from "./nav-rail";
import { BottomNav } from "./bottom-nav";
import { EmptyConversation } from "./empty-conversation";
import { ChatView } from "@/features/chat/chat-view";
import { useConversationRealtime } from "./use-conversation-realtime";
import { useRequestRealtime } from "@/features/requests/use-request-realtime";

/** The whole app shell: nav + conversation list + open-conversation pane. */
export function DashboardView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const items = useConversations((s) => s.items);
  const clearUnread = useConversations((s) => s.clearUnread);
  const selected = items.find((c) => c.id === selectedId) ?? null;

  useConversationRealtime(selectedId);
  useRequestRealtime();

  function onSelect(id: string) {
    setSelectedId(id);
    clearUnread(id);
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <NavRail className="hidden md:flex" />

      <ConversationPanel
        selectedId={selectedId}
        onSelect={onSelect}
        className={cn(
          "w-full md:w-[360px] md:shrink-0 md:border-r",
          selected && "hidden md:flex",
        )}
      />

      <section
        className={cn(
          "min-w-0 flex-1 flex-col",
          selected ? "flex" : "hidden md:flex",
        )}
      >
        {selected ? (
          <ChatView
            key={selected.id}
            conversation={selected}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <EmptyConversation />
        )}
      </section>

      <BottomNav className={cn("md:hidden", selected && "hidden")} />
    </div>
  );
}
