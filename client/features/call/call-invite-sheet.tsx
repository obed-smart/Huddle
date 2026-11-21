"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Phone } from "lucide-react";

import { SheetModal } from "@/components/ui/sheet-modal";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/lib/notify";
import { fetchGroupDetails, type GroupMember } from "@/lib/api/group";
import { useSession } from "@/stores/session";
import { callSession } from "./call-session";

type Props = { conversationId: string; open: boolean; onClose: () => void };

/** Invite people into the current call. It lists the conversation's members
    (minus whoever we are); tapping one rings them, and they get a normal
    incoming call. Backend authorization decides who may actually be invited. */
export function CallInviteSheet({ conversationId, open, onClose }: Props) {
  const me = useSession((s) => s.user?.id);
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [error, setError] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchGroupDetails(conversationId)
      .then((g) => {
        if (!cancelled) setMembers(g.participants.filter((m) => m.id !== me));
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, conversationId, me]);

  function invite(m: GroupMember) {
    callSession.invite(m.id);
    setInvited((prev) => new Set(prev).add(m.id));
    toast(`Invited @${m.username}.`);
  }

  return (
    <SheetModal
      open={open}
      onClose={onClose}
      label="Invite to call"
      onExited={() => {
        setInvited(new Set());
        setMembers(null);
        setError(false);
      }}
    >
      <header className="border-b px-4 py-3">
        <p className="text-sm font-semibold">Invite to call</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {members === null && !error ? (
          <Hint>
            <Loader2 className="mx-auto size-5 animate-spin" />
          </Hint>
        ) : error ? (
          <Hint>Could not load members.</Hint>
        ) : !members?.length ? (
          <Hint>No one else to invite.</Hint>
        ) : (
          members.map((m) => {
            const done = invited.has(m.id);
            const name = m.displayName || m.username;
            return (
              <div key={m.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                <Avatar src={m.avatarUrl} name={name} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                </div>
                <button
                  type="button"
                  disabled={done}
                  onClick={() => invite(m)}
                  aria-label={done ? `Invited ${name}` : `Invite ${name}`}
                  className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95 disabled:bg-secondary disabled:text-muted-foreground"
                >
                  {done ? <Check className="size-4" /> : <Phone className="size-4" />}
                </button>
              </div>
            );
          })
        )}
      </div>
    </SheetModal>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-8 text-center text-sm text-muted-foreground">{children}</div>;
}
