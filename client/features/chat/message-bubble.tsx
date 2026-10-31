"use client";

import { AlertCircle, Check, CheckCheck, Clock, Pencil } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/lib/notify";
import { Avatar } from "@/components/ui/avatar";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { AttachmentGroup } from "@/components/ui/attachment";
import { MESSAGE_TYPES, type Message as Msg, type Reaction } from "@/lib/messages/types";
import { ChatAttachment } from "./attachment-preview";

function clock(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function reactionsOf(message: Msg): Reaction[] {
  const raw = message.metadata?.reactions;
  return Array.isArray(raw) ? (raw as Reaction[]) : [];
}

type Props = {
  message: Msg;
  mine: boolean;
  isGroup: boolean;
  showAvatar: boolean;
  showName: boolean;
};

/** One message row, composed from the ChatCN Message and Bubble primitives. */
export function MessageBubble({ message, mine, isGroup, showAvatar, showName }: Props) {
  if (message.type === MESSAGE_TYPES.SYSTEM) {
    return (
      <Marker variant="separator" className="py-1">
        <MarkerContent>{message.system}</MarkerContent>
      </Marker>
    );
  }

  const reactions = reactionsOf(message);
  const hasText = Boolean(message.content) && !message.deleted;
  const name = message.sender.displayName || message.sender.username || "Someone";
  const canEdit = mine && message.type === MESSAGE_TYPES.TEXT && !message.deleted && !message.pending;

  return (
    <Message align={mine ? "end" : "start"}>
      {!mine && isGroup ? (
        <MessageAvatar className={cn(!showAvatar && "invisible")}>
          <Avatar src={message.sender.avatar} name={name} className="size-8" />
        </MessageAvatar>
      ) : null}

      <MessageContent>
        {showName && !mine ? <MessageHeader>{name}</MessageHeader> : null}

        <Bubble
          variant={mine ? "default" : "muted"}
          align={mine ? "end" : "start"}
          className={cn(message.pending && "opacity-70", message.failed && "opacity-90")}
        >
          {message.attachments.length > 0 ? (
            <AttachmentGroup className="mb-1">
              {message.attachments.map((a) => (
                <ChatAttachment key={a.id} attachment={a} />
              ))}
            </AttachmentGroup>
          ) : null}

          {message.deleted ? (
            <BubbleContent className="italic opacity-70">Message deleted</BubbleContent>
          ) : hasText ? (
            <BubbleContent className="whitespace-pre-wrap">{message.content}</BubbleContent>
          ) : null}

          {reactions.length > 0 ? (
            <BubbleReactions side="bottom" align={mine ? "end" : "start"}>
              {reactions.map((r) => (
                <span key={r.emoji} className="text-xs">
                  {r.emoji} {r.count}
                </span>
              ))}
            </BubbleReactions>
          ) : null}
        </Bubble>

        <MessageFooter className="gap-1">
          {message.edited ? <span>edited</span> : null}
          <span>{clock(message.createdAt)}</span>
          {mine ? <Status message={message} /> : null}
          {message.failed ? (
            <span className="text-destructive">
              · {message.failureMessage || "Not delivered"}
            </span>
          ) : null}
        </MessageFooter>
      </MessageContent>

      {canEdit ? (
        <button
          type="button"
          aria-label="Edit message"
          onClick={() => toast("Editing messages is coming soon.")}
          className="mt-1 hidden size-7 shrink-0 place-items-center self-center rounded-full text-muted-foreground transition-colors hover:bg-secondary group-hover/message:grid"
        >
          <Pencil className="size-3.5" />
        </button>
      ) : null}
    </Message>
  );
}

function Status({ message }: { message: Msg }) {
  if (message.failed) return <AlertCircle className="size-3 text-destructive" />;
  if (message.pending) return <Clock className="size-3" />;
  if (message.id) return <CheckCheck className="size-3" />;
  return <Check className="size-3" />;
}
