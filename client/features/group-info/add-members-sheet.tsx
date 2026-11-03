"use client";

import { useState } from "react";
import { Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SheetModal } from "@/components/ui/sheet-modal";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { inviteMember } from "@/lib/api/group";
import type { SearchedUser } from "@/lib/api/users";
import { useUserSearch } from "@/features/search/use-user-search";
import { MemberOption } from "@/features/groups/member-option";

type Props = { groupId: string; open: boolean; onClose: () => void; onAdded: () => void };

/** Search people and invite them into the group (one invite per selection). */
export function AddMembersSheet({ groupId, open, onClose, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SearchedUser[]>([]);
  const [busy, setBusy] = useState(false);
  const { results, status } = useUserSearch(query);

  function toggle(u: SearchedUser) {
    setSelected((prev) => (prev.some((x) => x.id === u.id) ? prev.filter((x) => x.id !== u.id) : [...prev, u]));
  }

  async function add() {
    if (selected.length === 0 || busy) return;
    setBusy(true);
    try {
      await Promise.all(selected.map((u) => inviteMember(groupId, u.id)));
      toast(selected.length === 1 ? `Invited @${selected[0].username}.` : `Invited ${selected.length} people.`);
      onAdded();
      onClose();
    } catch (e) {
      setBusy(false);
      toast(e instanceof ApiError ? e.message : "Could not add members.");
    }
  }

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      label="Add members"
      onExited={() => {
        setQuery("");
        setSelected([]);
        setBusy(false);
      }}
    >
      <header className="flex items-center gap-2 border-b px-3 py-2.5">
        <p className="flex-1 text-sm font-semibold">Add members</p>
        <Button size="sm" disabled={selected.length === 0 || busy} onClick={add}>
          {busy ? <Loader2 className="animate-spin" /> : null}
          Add{selected.length ? ` · ${selected.length}` : ""}
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="relative mb-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            aria-label="Search by username"
            className="pl-9"
          />
        </div>
        {status === "idle" ? (
          <Hint>Search to add people.</Hint>
        ) : status === "loading" ? (
          <Hint>Searching…</Hint>
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
    </SheetModal>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="px-2 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}
