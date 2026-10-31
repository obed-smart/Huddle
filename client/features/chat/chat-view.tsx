"use client";

import type { Conversation } from "@/lib/api/types";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { useChat } from "./use-chat";
import { useTyping } from "./use-typing";

type Props = { conversation: Conversation; onBack: () => void };

/** The inner chat screen: header, transcript, and composer, all live. */
export function ChatView({ conversation, onBack }: Props) {
  const isGroup = conversation.type === "group";
  const { messages, status, send, sendMedia, currentUser } = useChat(conversation.id);
  const { label, ping } = useTyping(conversation.id, isGroup);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-secondary/40">
      <ChatHeader conversation={conversation} onBack={onBack} />

      <MessageList
        messages={messages}
        loading={status === "loading"}
        isGroup={isGroup}
        currentUser={currentUser}
        typingLabel={label}
      />

      <ChatComposer onSend={send} onSendMedia={sendMedia} onTyping={() => ping("typing")} />
    </div>
  );
}
