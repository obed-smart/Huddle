"use client";

import { useState, type ReactNode } from "react";
import { Loader2, Shield, ShieldOff, UserMinus } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { SheetModal } from "@/components/ui/sheet-modal";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { removeMember, setMemberRole, type GroupMember } from "@/lib/api/group";

type Props = {
  groupId: string;
  member: GroupMember | null;
  canManage: boolean;
  onClose: () => void;
  onChanged: () => void;
};

/** Acting on one member: a bottom sheet (up from the bottom on phones) with
    make/dismiss admin and remove, shown only to admins acting on others. */
export function MemberActionsSheet({ groupId, member, canManage, onClose, onChanged }: Props) {
  const [busy, setBusy] = useState(false);
  const name = member ? member.displayName || member.username : "";
  const isAdmin = member?.role === "admin" || member?.role === "super_admin";

  async function run(fn: () => Promise<unknown>, done: string) {
    if (!member || busy) return;
    setBusy(true);
    try {
      await fn();
      toast(done);
      onChanged();
      onClose();
    } catch (e) {
      setBusy(false);
      toast(e instanceof ApiError ? e.message : "Something went wrong.");
    }
  }

  const actionable = canManage && member !== null && member.role !== "super_admin";

  return (
    <SheetModal open={member !== null} onClose={onClose} label={name} onExited={() => setBusy(false)}>
      {member ? (
        <>
          <div className="flex flex-col items-center gap-1.5 px-4 pb-4 pt-6">
            <Avatar src={member.avatarUrl} name={name} className="size-16" />
            <p className="text-base font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">@{member.username}</p>
          </div>

          {actionable ? (
            <div className="border-t p-2">
              <Action
                icon={isAdmin ? <ShieldOff /> : <Shield />}
                busy={busy}
                onClick={() =>
                  run(
                    () => setMemberRole(groupId, member.id, isAdmin ? "member" : "admin"),
                    isAdmin ? `${name} is no longer an admin.` : `${name} is now an admin.`,
                  )
                }
              >
                {isAdmin ? "Dismiss as admin" : "Make group admin"}
              </Action>
              <Action
                icon={<UserMinus />}
                destructive
                busy={busy}
                onClick={() => run(() => removeMember(groupId, member.id), `${name} removed.`)}
              >
                Remove from group
              </Action>
            </div>
          ) : (
            <p className="border-t px-4 py-5 text-center text-xs text-muted-foreground">
              No actions available.
            </p>
          )}
        </>
      ) : null}
    </SheetModal>
  );
}

function Action({
  icon,
  children,
  onClick,
  busy,
  destructive,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  busy?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary disabled:opacity-60",
        destructive && "text-destructive hover:bg-destructive/10",
      )}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
