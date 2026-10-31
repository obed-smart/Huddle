"use client";

import { useEffect } from "react";

import { emitWithAck, getSocket, onSocketConnected, type Ack } from "@/lib/socket";
import { conversationIdOf, normalizeMessage } from "@/lib/messages/normalize";
import type { Message } from "@/lib/messages/types";
import { useMessages } from "@/stores/messages";
import { useConversations } from "@/stores/conversations";
import { useSession } from "@/stores/session";
import { isMine, senderFromUser } from "./owner";

/* The event names a server might use for "a message arrived". */
const MESSAGE_EVENTS = ["message:new", "message:created", "newMessage", "message"];
const EMPTY: Message[] = [];

/* The ack's `message` carries the new id on success, but the same field holds
   a sentence on failure, so only id-shaped text is accepted as an id. */
function idFromAck(ack: Ack): string | null {
  const direct = ack.data?.id ?? ack.data?.messageId;
  if (direct) return direct;
  const m = ack.message;
  return typeof m === "string" && /^[A-Za-z0-9_-]{8,}$/.test(m.trim()) ? m.trim() : null;
}

/** Open a conversation: load its history, join its room (rejoining on
    reconnect), stream in new messages, and send with optimistic echo. */
export function useChat(conversationId: string) {
  const user = useSession((s) => s.user);
  const messages = useMessages((s) => s.byId[conversationId] ?? EMPTY);
  const status = useMessages((s) => s.status[conversationId] ?? "idle");
  const load = useMessages((s) => s.load);
  const record = useMessages((s) => s.record);
  const settle = useMessages((s) => s.settle);
  const bump = useConversations((s) => s.bump);

  useEffect(() => {
    load(conversationId);
    const socket = getSocket();
    const offConnected = onSocketConnected(() => {
      emitWithAck("conversation:join", { conversationId });
    });

    const handler = (payload: Record<string, unknown>) => {
      if (conversationIdOf(payload) !== conversationId) return;
      const message = normalizeMessage(payload, { conversationId, source: "socket" });
      if (!message) return;
      message.mine = isMine(message, user);
      record(conversationId, message);
      bump(conversationId);
    };
    if (socket) for (const e of MESSAGE_EVENTS) socket.on(e, handler);

    return () => {
      offConnected();
      if (socket) for (const e of MESSAGE_EVENTS) socket.off(e, handler);
    };
  }, [conversationId, user, load, record, bump]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || !conversationId) return;

    const tempId = crypto.randomUUID();
    const optimistic = normalizeMessage(
      { tempId, content, createdAt: new Date().toISOString(), sender: senderFromUser(user) },
      { conversationId, source: "local", pending: true, mine: true },
    );
    if (!optimistic) return;

    record(conversationId, optimistic);
    bump(conversationId);

    const ack = await emitWithAck("message:send", { tempId, conversationId, content });
    if (ack.success === false) {
      settle(conversationId, tempId, { failed: true, failureMessage: ack.message });
    } else {
      settle(conversationId, tempId, { id: idFromAck(ack) });
    }
  }

  return { messages, status, send, currentUser: user };
}
