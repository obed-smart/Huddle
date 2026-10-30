"use client";

import { useEffect, useState } from "react";
import { Search, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { UserButton } from "@/features/dashboard/user-button";
import { useConversations } from "@/stores/conversations";
import { ConversationList } from "./conversation-list";
import { ConversationTabs, type ConversationFilter } from "./conversation-tabs";

type Props = {
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
};

/** The left column: header + search + tabs + the conversation list. */
export function ConversationPanel({ selectedId, onSelect, className }: Props) {
  const load = useConversations((s) => s.load);
  const status = useConversations((s) => s.status);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  return (
    <div className={cn("flex min-h-0 flex-col bg-background", className)}>
      <header className="glass sticky top-0 z-10 flex flex-col gap-3 border-b px-4 py-3">
        <div className="flex items-center justify-between gap-1">
          <h1 className="font-display text-xl font-bold tracking-tight">Chats</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle className="md:hidden" />
            <Button
              variant="ghost"
              size="icon"
              aria-label="New chat"
              onClick={() => toast("Starting a new chat is coming soon.")}
            >
              <PenSquare />
            </Button>
            <span className="md:hidden">
              <UserButton menuSide="bottom" />
            </span>
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search conversations"
            className="pl-9"
          />
        </div>
        <ConversationTabs value={filter} onChange={setFilter} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0">
        <ConversationList
          filter={filter}
          query={query}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
