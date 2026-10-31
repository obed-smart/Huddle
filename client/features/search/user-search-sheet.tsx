"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Users, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetModal } from "@/components/ui/sheet-modal";
import { useUserSearch } from "./use-user-search";
import { UserResult } from "./user-result";

type Props = { open: boolean; onClose: () => void; onNewGroup?: () => void };

/** The "find people" task: search by username to start a chat, or jump to
    creating a group. Presented as a focused modal via SheetModal. */
export function UserSearchSheet({ open, onClose, onNewGroup }: Props) {
  const [query, setQuery] = useState("");
  const { results, status } = useUserSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const focus = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(focus);
  }, [open]);

  return (
    <SheetModal open={open} onClose={onClose} label="Find people" onExited={() => setQuery("")}>
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            aria-label="Search by username"
            className="pl-9"
          />
        </div>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
          <X />
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {onNewGroup ? (
          <button
            type="button"
            onClick={onNewGroup}
            className="mb-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Users className="size-5" />
            </span>
            <span className="text-sm font-medium">New group</span>
          </button>
        ) : null}

        <Body query={query} results={results} status={status} />
      </div>
    </SheetModal>
  );
}

function Body({
  query,
  results,
  status,
}: {
  query: string;
  results: ReturnType<typeof useUserSearch>["results"];
  status: ReturnType<typeof useUserSearch>["status"];
}) {
  if (status === "idle") return <Hint>Search by username to start a chat.</Hint>;
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Searching…
      </div>
    );
  }
  if (status === "error") return <Hint>Could not search just now. Try again.</Hint>;
  if (results.length === 0) return <Hint>No one found for “{query.trim()}”.</Hint>;
  return (
    <div className="flex flex-col">
      {results.map((user) => (
        <UserResult key={user.id} user={user} />
      ))}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
