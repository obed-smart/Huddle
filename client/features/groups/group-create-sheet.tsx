"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Loader2, Search, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetModal } from "@/components/ui/sheet-modal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { createGroup } from "@/lib/api/groups";
import type { SearchedUser } from "@/lib/api/users";
import { useUserSearch } from "@/features/search/use-user-search";
import { useConversations } from "@/stores/conversations";
import { MemberOption } from "./member-option";

type Props = { open: boolean; onClose: () => void; onBack?: () => void };

const MIN_MEMBERS = 2;

/** Name a group and pick its members, then create it (the server invites
    everyone selected). A focused modal; full task on phones, centered on desktop. */
export function GroupCreateSheet({ open, onClose, onBack }: Props) {
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [selected, setSelected] = useState<SearchedUser[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const { results, status } = useUserSearch(query);
  const refresh = useConversations((s) => s.refresh);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const f = requestAnimationFrame(() => nameRef.current?.focus());
    return () => cancelAnimationFrame(f);
  }, [open]);

  function reset() {
    setName("");
    setVisibility("private");
    setSelected([]);
    setQuery("");
    setCreating(false);
  }

  function toggle(user: SearchedUser) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  }

  const canCreate = name.trim().length >= 3 && selected.length >= MIN_MEMBERS && !creating;

  async function create() {
    if (!canCreate) return;
    setCreating(true);
    try {
      await createGroup({ name: name.trim(), visibility, participantIds: selected.map((u) => u.id) });
      toast(`Group “${name.trim()}” created.`);
      await refresh();
      onClose();
    } catch (e) {
      setCreating(false);
      toast(e instanceof ApiError ? e.message : "Could not create the group.");
    }
  }

  return (
    <SheetModal open={open} onClose={onClose} label="New group" onExited={reset}>
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button variant="ghost" size="icon" aria-label="Back" onClick={onBack ?? onClose}>
          <ArrowLeft />
        </Button>
        <p className="flex-1 text-sm font-semibold">New group</p>
        <Button size="sm" disabled={!canCreate} onClick={create}>
          {creating ? <Loader2 className="animate-spin" /> : null}
          Create{selected.length ? ` · ${selected.length}` : ""}
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <Input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name"
          aria-label="Group name"
          maxLength={100}
        />

        <div className="mt-3 flex rounded-full bg-secondary p-1 text-xs">
          {(["private", "public"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 font-medium capitalize transition-colors",
                visibility === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {selected.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selected.map((u) => (
              <span key={u.id} className="flex items-center gap-1.5 rounded-full bg-secondary py-1 pl-1 pr-2 text-xs">
                <Avatar src={u.avatarUrl} name={u.displayName || u.username} className="size-5" />
                {u.displayName || u.username}
                <button
                  type="button"
                  aria-label={`Remove ${u.username}`}
                  onClick={() => toggle(u)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Add members by username"
            aria-label="Add members"
            className="pl-9"
          />
        </div>

        <div className="mt-2">
          {status === "loading" ? (
            <Hint>Searching…</Hint>
          ) : status === "idle" ? (
            <Hint>Search to add members. Pick at least {MIN_MEMBERS}.</Hint>
          ) : results.length === 0 ? (
            <Hint>No one found.</Hint>
          ) : (
            results.map((u) => (
              <MemberOption
                key={u.id}
                user={u}
                selected={selected.some((s) => s.id === u.id)}
                onToggle={() => toggle(u)}
              />
            ))
          )}
        </div>
      </div>
    </SheetModal>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="px-2 py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
