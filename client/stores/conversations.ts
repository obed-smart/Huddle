import { create } from "zustand";

import type { Conversation } from "@/lib/api/types";
import { fetchConversations } from "@/lib/api/conversations";

type Status = "idle" | "loading" | "ready" | "error";

type ConversationsState = {
  items: Conversation[];
  status: Status;
  error: string | null;
  unread: Record<string, number>;
  load: () => Promise<void>;
  /** Move a conversation to the top (a message arrived there). */
  bump: (conversationId: string) => void;
  incUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
};

export const useConversations = create<ConversationsState>((set, get) => ({
  items: [],
  status: "idle",
  error: null,
  unread: {},

  load: async () => {
    set({ status: "loading", error: null });
    try {
      const items = await fetchConversations();
      set({ items: Array.isArray(items) ? items : [], status: "ready" });
    } catch (err) {
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Could not load conversations.",
      });
    }
  },

  bump: (conversationId) => {
    const items = get().items;
    const index = items.findIndex((c) => c.id === conversationId);
    if (index <= 0) return;
    const next = items.slice();
    const [moved] = next.splice(index, 1);
    next.unshift(moved);
    set({ items: next });
  },

  incUnread: (conversationId) =>
    set((s) => ({
      unread: { ...s.unread, [conversationId]: (s.unread[conversationId] ?? 0) + 1 },
    })),

  clearUnread: (conversationId) =>
    set((s) => ({ unread: { ...s.unread, [conversationId]: 0 } })),
}));
