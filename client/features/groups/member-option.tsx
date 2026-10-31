"use client";

import { Check } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { SearchedUser } from "@/lib/api/users";

/** A user row that toggles in/out of the group member selection. */
export function MemberOption({
  user,
  selected,
  onToggle,
}: {
  user: SearchedUser;
  selected: boolean;
  onToggle: () => void;
}) {
  const name = user.displayName || user.username;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary"
    >
      <Avatar src={user.avatarUrl} name={name} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
      </div>
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {selected ? <Check className="size-3.5" /> : null}
      </span>
    </button>
  );
}
