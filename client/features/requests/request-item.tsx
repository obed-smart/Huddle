"use client";

import { useState, type ReactNode } from "react";
import { Check, Loader2, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";

type Props = {
  avatarName: string;
  avatarSrc?: string | null;
  title: ReactNode;
  subtitle: string;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onDone: () => void;
};

/** One pending request (a ping or an invite) with accept/decline actions. */
export function RequestItem({ avatarName, avatarSrc, title, subtitle, onAccept, onDecline, onDone }: Props) {
  const [busy, setBusy] = useState<null | "accept" | "decline">(null);

  async function run(kind: "accept" | "decline", fn: () => Promise<void>) {
    if (busy) return;
    setBusy(kind);
    try {
      await fn();
      onDone();
    } catch (err) {
      setBusy(null);
      toast(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <Avatar src={avatarSrc} name={avatarName} className="size-9" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          size="icon-sm"
          aria-label="Accept"
          disabled={busy !== null}
          onClick={() => run("accept", onAccept)}
        >
          {busy === "accept" ? <Loader2 className="animate-spin" /> : <Check />}
        </Button>
        <Button
          size="icon-sm"
          variant="secondary"
          aria-label="Decline"
          disabled={busy !== null}
          onClick={() => run("decline", onDecline)}
        >
          {busy === "decline" ? <Loader2 className="animate-spin" /> : <X />}
        </Button>
      </div>
    </div>
  );
}
