"use client";

import { AlertCircle, Check, CheckCheck, Clock, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { MESSAGE_TYPES, type Message, type Reaction } from "@/lib/messages/types";
import { AttachmentPreview } from "./attachment-preview";

function clock(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Reactions the server attached to a message, if any (display only for now). */
function reactionsOf(message: Message): Reaction[] {
  const raw = message.metadata?.reactions;
  return Array.isArray(raw) ? (raw as Reaction[]) : [];
}

type Props = { message: Message; mine: boolean; showName: boolean };

/** One message. Mine sit right on the primary tint, others left on a card. */
export function MessageBubble({ message, mine, showName }: Props) {
  if (message.type === MESSAGE_TYPES.SYSTEM) {
    return (
      <div className="my-1 text-center text-xs text-muted-foreground">{message.system}</div>
    );
  }

  const reactions = reactionsOf(message);
  const hasText = Boolean(message.content) && !message.deleted;
  const canEdit = mine && message.type === MESSAGE_TYPES.TEXT && !message.deleted && !message.pending;

  return (
    <div className={cn("group flex w-full gap-2", mine ? "justify-end" : "justify-start")}>
      {canEdit ? (
        <button
          type="button"
          aria-label="Edit message"
          onClick={() => toast("Editing messages is coming soon.")}
          className="mt-1 hidden size-7 shrink-0 place-items-center self-center rounded-full text-muted-foreground transition-colors hover:bg-secondary group-hover:grid"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}

      <div className="flex min-w-0 max-w-[78%] flex-col gap-1 sm:max-w-[68%]">
        {showName && !mine ? (
          <span className="px-1 text-xs font-medium text-muted-foreground">
            {message.sender.displayName || message.sender.username || "Someone"}
          </span>
        ) : null}

        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm shadow-sm transition-opacity",
            mine
              ? "rounded-br-md bg-primary text-primary-foreground"
              : "rounded-bl-md bg-card text-card-foreground",
            message.pending && "opacity-70",
            message.failed && "ring-1 ring-destructive",
          )}
        >
          {message.attachments.length > 0 ? (
            <div className="mb-1 flex flex-col gap-1.5">
              {message.attachments.map((a) => (
                <AttachmentPreview key={a.id} attachment={a} />
              ))}
            </div>
          ) : null}

          {message.deleted ? (
            <span className="italic opacity-70">Message deleted</span>
          ) : hasText ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : null}

          <span
            className={cn(
              "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
              mine ? "text-primary-foreground/70" : "text-muted-foreground",
            )}
          >
            {message.edited ? <span>edited</span> : null}
            {clock(message.createdAt)}
            {mine ? <Status message={message} /> : null}
          </span>
        </div>

        {reactions.length > 0 ? (
          <div className={cn("flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
            {reactions.map((r) => (
              <span
                key={r.emoji}
                className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground"
              >
                {r.emoji} {r.count}
              </span>
            ))}
          </div>
        ) : null}

        {message.failed ? (
          <span className="px-1 text-[10px] text-destructive">
            {message.failureMessage || "Not delivered"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Status({ message }: { message: Message }) {
  if (message.failed) return <AlertCircle className="size-3 text-destructive" />;
  if (message.pending) return <Clock className="size-3" />;
  if (message.id) return <CheckCheck className="size-3" />;
  return <Check className="size-3" />;
}
