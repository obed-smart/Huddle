"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A round icon action in the group-info header row (Add, Invite link, Leave). */
export function InfoAction({
  icon,
  label,
  onClick,
  destructive,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-full",
          destructive ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground",
        )}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
