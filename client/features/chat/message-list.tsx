"use client";

import { useEffect, useRef } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import type { Message } from "@/lib/messages/types";
import type { AuthUser } from "@/lib/api/types";
import { isMine } from "./owner";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";

type Props = {
  messages: Message[];
  loading: boolean;
  isGroup: boolean;
  currentUser: AuthUser | null;
  typingLabel: string | null;
};

/** The scrollable transcript. Sticks to the bottom as new messages land. */
export function MessageList({ messages, loading, isGroup, currentUser, typingLabel }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typingLabel]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className={i % 2 ? "ml-auto h-10 w-48" : "h-10 w-56"} />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">No messages yet. Say something.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4 sm:px-4">
      {messages.map((message, i) => {
        const mine = isMine(message, currentUser);
        const prev = messages[i - 1];
        const samePrev = prev && (prev.sender.id ?? prev.sender.username) === (message.sender.id ?? message.sender.username);
        return (
          <MessageBubble
            key={message.tempId || message.id || `m-${i}`}
            message={message}
            mine={mine}
            showName={isGroup && !mine && !samePrev}
          />
        );
      })}

      {typingLabel ? <TypingIndicator label={typingLabel} /> : null}
      <div ref={endRef} />
    </div>
  );
}
