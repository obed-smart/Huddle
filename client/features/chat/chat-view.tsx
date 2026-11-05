"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";

import type { Conversation } from "@/lib/api/types";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { ChatComposer } from "./chat-composer";
import { useChat } from "./use-chat";
import { useTyping } from "./use-typing";
import { useConversationPeople } from "./use-conversation-people";
import { GroupInfo } from "@/features/group-info/group-info";
import { DmInfo } from "@/features/dm-info/dm-info";

type Props = { conversation: Conversation; onBack: () => void };

/** The inner chat screen. On a large screen the info panel is a third column
    beside the chat (sidebar, chat, info); on a phone it covers the screen. */
export function ChatView({ conversation, onBack }: Props) {
  const isGroup = conversation.type === "group";
  const { messages, status, send, sendMedia, currentUser } = useChat(conversation.id);
  const { label, ping } = useTyping(conversation.id, isGroup);
  const [infoOpen, setInfoOpen] = useState(false);

  // Learn who is in this conversation, so a message's senderId resolves to a name.
  useConversationPeople(conversation, currentUser);

  const close = () => setInfoOpen(false);

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex min-h-0 flex-1 flex-col bg-secondary/40">
        <ChatHeader conversation={conversation} onBack={onBack} onOpenInfo={() => setInfoOpen(true)} />

        <MessageList
          messages={messages}
          loading={status === "loading"}
          isGroup={isGroup}
          currentUser={currentUser}
          typingLabel={label}
        />

        <ChatComposer onSend={send} onSendMedia={sendMedia} onTyping={() => ping("typing")} />
      </div>

      <AnimatePresence>
        {infoOpen ? (
          isGroup ? (
            <GroupInfo key="group-info" conversation={conversation} onClose={close} />
          ) : (
            <DmInfo key="dm-info" conversation={conversation} onClose={close} />
          )
        ) : null}
      </AnimatePresence>
    </div>
  );
}
