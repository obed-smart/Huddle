"use client";

import { useEffect, useRef, useState, type UIEvent } from "react";
import { Search, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { NotificationBell } from "@/features/dashboard/notification-bell";
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
  const unread = useConversations((s) => s.unread);
  const unreadCount = Object.values(unread).filter((n) => n > 0).length;

  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [query, setQuery] = useState("");
  const [searchHidden, setSearchHidden] = useState(false);
  const lastScroll = useRef(0);

  useEffect(() => {
    if (status === "idle") load();
  }, [status, load]);

  // The search tucks away as you scroll down the list and comes back at the
  // top or on a scroll up, as part of the header rather than a popover.
  function onScroll(e: UIEvent<HTMLDivElement>) {
    const top = e.currentTarget.scrollTop;
    const prev = lastScroll.current;
    if (top <= 8) setSearchHidden(false);
    else if (top > prev + 6) setSearchHidden(true);
    else if (top < prev - 6) setSearchHidden(false);
    lastScroll.current = top;
  }

  return (
    <div className={cn("flex min-h-0 flex-col bg-background", className)}>
      <header className="glass sticky top-0 z-10 flex flex-col border-b px-4 py-3">
        <div className="flex items-center justify-between gap-1">
          <h1 className="font-display text-xl font-bold tracking-tight">Chats</h1>
          <div className="flex items-center gap-1">
            <ThemeToggle className="md:hidden" />
            <NotificationBell />
            <Button
              variant="ghost"
              size="icon"
              aria-label="New chat"
              onClick={() => toast("Starting a new chat is coming soon.")}
            >
              <PenSquare />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200 ease-out",
            searchHidden ? "mt-0 max-h-0 opacity-0" : "mt-3 max-h-14 opacity-100",
          )}
        >
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
        </div>

        <div className="mt-3">
          <ConversationTabs
            value={filter}
            onChange={setFilter}
            unreadCount={unreadCount}
          />
        </div>
      </header>

      <div
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto pb-20 md:pb-0"
      >
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
