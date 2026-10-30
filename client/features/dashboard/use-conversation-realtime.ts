"use client";

import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { useConversations } from "@/stores/conversations";

/* The server may name the "a message arrived" event any of these. */
const MESSAGE_EVENTS = ["message:new", "message:created", "newMessage", "message"];

type MessagePayload = {
  conversationId?: string;
  data?: { conversationId?: string };
  message?: { conversationId?: string };
};

/** Move a conversation to the top (and bump its unread) when a message lands. */
export function useConversationRealtime(activeId: string | null) {
  const bump = useConversations((s) => s.bump);
  const incUnread = useConversations((s) => s.incUnread);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (payload: MessagePayload) => {
      const id =
        payload?.conversationId ??
        payload?.data?.conversationId ??
        payload?.message?.conversationId;
      if (!id) return;
      bump(id);
      if (id !== activeId) incUnread(id);
    };

    for (const event of MESSAGE_EVENTS) socket.on(event, handler);
    return () => {
      for (const event of MESSAGE_EVENTS) socket.off(event, handler);
    };
  }, [activeId, bump, incUnread]);
}
