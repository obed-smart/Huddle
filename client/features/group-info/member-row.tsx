"use client";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { GroupMember } from "@/lib/api/group";

function roleLabel(role: GroupMember["role"]): string | null {
  if (role === "super_admin") return "Owner";
  if (role === "admin") return "Admin";
  return null;
}

type Props = { member: GroupMember; isMe: boolean; onOpen?: () => void };

/** A participant row. Tapping opens the action sheet when the viewer can act. */
export function MemberRow({ member, isMe, onOpen }: Props) {
  const name = member.displayName || member.username;
  const badge = roleLabel(member.role);

  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={!onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
        onOpen ? "hover:bg-secondary" : "cursor-default",
      )}
    >
      <Avatar src={member.avatarUrl} name={name} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {name}
          {isMe ? <span className="text-muted-foreground"> (You)</span> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">@{member.username}</p>
      </div>
      {badge ? (
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
