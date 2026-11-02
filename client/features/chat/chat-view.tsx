"use client";

import { useState } from "react";

import type { Conversation } from "@/lib/api/types";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { useChat } from "./use-chat";
import { useTyping } from "./use-typing";
import { GroupInfo } from "@/features/group-info/group-info";

type Props = { conversation: Conversation; onBack: () => void };

/** The inner chat screen: header, transcript, and composer, all live. */
export function ChatView({ conversation, onBack }: Props) {
  const isGroup = conversation.type === "group";
  const { messages, status, send, sendMedia, currentUser } = useChat(conversation.id);
  const { label, ping } = useTyping(conversation.id, isGroup);
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-secondary/40">
      <ChatHeader
        conversation={conversation}
        onBack={onBack}
        onOpenInfo={isGroup ? () => setInfoOpen(true) : undefined}
      />

      <MessageList
        messages={messages}
        loading={status === "loading"}
        isGroup={isGroup}
        currentUser={currentUser}
        typingLabel={label}
      />

      <ChatComposer onSend={send} onSendMedia={sendMedia} onTyping={() => ping("typing")} />

      {isGroup ? (
        <GroupInfo conversation={conversation} open={infoOpen} onClose={() => setInfoOpen(false)} />
      ) : null}
    </div>
  );
}
