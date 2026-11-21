"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Phone, Search } from "lucide-react";

import { SheetModal } from "@/components/ui/sheet-modal";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/lib/notify";
import type { GroupMember } from "@/lib/api/group";
import { useGroups, ensureGroup } from "@/stores/groups";
import { useSession } from "@/stores/session";
import { useCallParticipants } from "./call-participants";
import { useCallInvites } from "./call-invites";
import { callSession } from "./call-session";

type Props = { conversationId: string; open: boolean; onClose: () => void };

/** Invite people into the current call. The member list comes from the group
    cache (warmed when the conversation opened, so it is usually instant), with
    a search box on top. Each row rings once tapped and shows calling, then in
    call once they join, then returns to invitable if the ring times out. */
export function CallInviteSheet({ conversationId, open, onClose }: Props) {
  const me = useSession((s) => s.user?.id);
  const group = useGroups((s) => s.byId[conversationId]);
  const present = useCallParticipants((s) => s.present);
  const ringing = useCallInvites((s) => s.ringing);
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    ensureGroup(conversationId)
      .then(() => { if (!cancelled) setError(false); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [open, conversationId]);

  // A ringing invite who has now joined the call stops ringing.
  useEffect(() => {
    for (const id of Object.keys(ringing)) if (present.includes(id)) useCallInvites.getState().stop(id);
  }, [present, ringing]);

  const members = useMemo(() => {
    const list = group?.participants.filter((m) => m.id !== me) ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((m) => (m.displayName || m.username).toLowerCase().includes(q) || m.username.toLowerCase().includes(q));
  }, [group, me, query]);

  function invite(m: GroupMember) {
    callSession.invite(m.id);
    useCallInvites.getState().ring(m.id);
    toast(`Calling @${m.username}…`);
  }

  return (
    <SheetModal open={open} onClose={onClose} label="Invite to call" onExited={() => setQuery("")}>
      <header className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Invite to call</p>
      </header>
      <div className="border-b px-3 py-2">
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!group && !error ? (
          <Hint><Loader2 className="mx-auto size-5 animate-spin" /></Hint>
        ) : error ? (
          <Hint>Could not load people.</Hint>
        ) : !members.length ? (
          <Hint>{query ? "No one matches." : "No one else to invite."}</Hint>
        ) : (
          members.map((m) => {
            const joined = present.includes(m.id);
            const isRinging = !joined && !!ringing[m.id];
            const name = m.displayName || m.username;
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Avatar src={m.avatarUrl} name={name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">{joined ? "In call" : isRinging ? "Calling…" : `@${m.username}`}</p>
                </div>
                <InviteButton state={joined ? "joined" : isRinging ? "ringing" : "idle"} name={name} onClick={() => invite(m)} />
              </div>
            );
          })
        )}
      </div>
    </SheetModal>
  );
}

function InviteButton({ state, name, onClick }: { state: "idle" | "ringing" | "joined"; name: string; onClick: () => void }) {
  if (state === "joined")
    return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"><Check className="size-4" /></span>;
  if (state === "ringing")
    return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-primary"><Loader2 className="size-4 animate-spin" /></span>;
  return (
    <button type="button" onClick={onClick} aria-label={`Invite ${name}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95">
      <Phone className="size-4" />
    </button>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
