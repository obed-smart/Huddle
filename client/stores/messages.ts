import { create } from "zustand";

import { fetchMessages } from "@/lib/api/messages";
import type { Message } from "@/lib/messages/types";

type Status = "idle" | "loading" | "ready" | "error";

type SettlePatch = { id?: string | null; failed?: boolean; failureMessage?: string };

type MessagesState = {
  byId: Record<string, Message[]>;
  status: Record<string, Status>;
  load: (conversationId: string) => Promise<void>;
  /** Record a sent/received/optimistic message, reconciling echoes. */
  record: (conversationId: string, message: Message) => { reconciled: boolean };
  /** Apply the server's ack to a message we drew optimistically. */
  settle: (conversationId: string, tempId: string, patch: SettlePatch) => void;
  reset: () => void;
};

/* Three ways to recognise a message already held, most trustworthy first:
   its tempId (our own echo), its server id (a replay), or — only for our own
   un-named text — identical content. The last is deliberately narrow so two
   people saying "ok" never collapse into one. */
function findIndex(list: Message[], incoming: Message): number {
  if (incoming.tempId) {
    const i = list.findIndex((m) => m.tempId && m.tempId === incoming.tempId);
    if (i >= 0) return i;
  }
  if (incoming.id) {
    const i = list.findIndex((m) => m.id && m.id === incoming.id);
    if (i >= 0) return i;
  }
  if (incoming.mine !== true || incoming.attachments.length > 0) return -1;
  return list.findIndex(
    (m) =>
      m.mine === true &&
      !m.id &&
      m.content === incoming.content &&
      m.attachments.length === 0,
  );
}

/* Merged, not replaced: the optimistic copy holds local-only things (object
   URLs) the server's does not. */
function merge(existing: Message, incoming: Message): Message {
  return {
    ...existing,
    id: incoming.id ?? existing.id,
    createdAt: incoming.createdAt || existing.createdAt,
    updatedAt: incoming.updatedAt || existing.updatedAt,
    content: incoming.content || existing.content,
    attachments: incoming.attachments.length ? incoming.attachments : existing.attachments,
    sender: incoming.sender.id || incoming.sender.username ? incoming.sender : existing.sender,
    pending: false,
    failed: false,
    failureMessage: null,
    localOnly: false,
  };
}

export const useMessages = create<MessagesState>((set, get) => ({
  byId: {},
  status: {},

  load: async (conversationId) => {
    if (get().status[conversationId]) return; // already loading or loaded
    set((s) => ({ status: { ...s.status, [conversationId]: "loading" } }));
    try {
      const messages = await fetchMessages(conversationId);
      set((s) => ({
        byId: { ...s.byId, [conversationId]: messages },
        status: { ...s.status, [conversationId]: "ready" },
      }));
    } catch {
      set((s) => ({ status: { ...s.status, [conversationId]: "error" } }));
    }
  },

  record: (conversationId, message) => {
    const list = get().byId[conversationId] ?? [];
    const index = findIndex(list, message);
    const next = list.slice();
    const reconciled = index >= 0;
    if (reconciled) next[index] = merge(list[index], message);
    else next.push(message);
    set((s) => ({ byId: { ...s.byId, [conversationId]: next } }));
    return { reconciled };
  },

  settle: (conversationId, tempId, patch) => {
    const list = get().byId[conversationId];
    if (!list) return;
    const next = list.map((m) =>
      m.tempId === tempId
        ? {
            ...m,
            pending: false,
            id: patch.id ?? m.id,
            failed: Boolean(patch.failed),
            failureMessage: patch.failed ? patch.failureMessage ?? "Not delivered" : null,
            localOnly: patch.failed ? m.localOnly : false,
          }
        : m,
    );
    set((s) => ({ byId: { ...s.byId, [conversationId]: next } }));
  },

  reset: () => set({ byId: {}, status: {} }),
}));
