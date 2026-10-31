"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
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

const senderKey = (m: Message) => m.sender.id ?? m.sender.username ?? "";

/** The scrollable transcript, built on the ChatCN MessageScroller (sticks to
    the bottom, restores position, and offers a jump-to-latest button). */
export function MessageList({ messages, loading, isGroup, currentUser, typingLabel }: Props) {
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
    <MessageScrollerProvider autoScroll>
      <MessageScroller className="flex-1">
        <MessageScrollerViewport className="px-3 py-4 sm:px-4">
          <MessageScrollerContent className="gap-3">
            {messages.map((message, i) => {
              const mine = isMine(message, currentUser);
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const samePrev = prev && senderKey(prev) === senderKey(message);
              const sameNext = next && senderKey(next) === senderKey(message);
              return (
                <MessageScrollerItem
                  key={message.tempId || message.id || `m-${i}`}
                  messageId={message.tempId || message.id || `m-${i}`}
                  scrollAnchor={mine}
                >
                  <MessageBubble
                    message={message}
                    mine={mine}
                    isGroup={isGroup}
                    showAvatar={!sameNext}
                    showName={isGroup && !samePrev}
                  />
                </MessageScrollerItem>
              );
            })}

            {typingLabel ? (
              <MessageScrollerItem messageId="typing">
                <TypingIndicator label={typingLabel} />
              </MessageScrollerItem>
            ) : null}
          </MessageScrollerContent>
        </MessageScrollerViewport>

        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
