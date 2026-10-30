"use client";

import { X } from "lucide-react";
import { toast } from "sonner";

export type MessageToastProps = {
  /** Sonner toast id, for dismiss. */
  id: string | number;
  name: string;
  text: string;
  avatarUrl?: string | null;
  /** Called when the toast body is clicked (e.g. open the conversation). */
  onOpen?: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** A headless "new message" toast: avatar, sender, preview. Follows our tokens. */
export function MessageToast({ id, name, text, avatarUrl, onOpen }: MessageToastProps) {
  return (
    <div className="flex w-[356px] max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg">
      <button
        type="button"
        onClick={() => {
          onOpen?.();
          toast.dismiss(id);
        }}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials(name)}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{name}</span>
          <span className="line-clamp-2 text-sm text-muted-foreground">{text}</span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
