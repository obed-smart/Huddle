import { create } from "zustand";

import { fetchActiveMeets, type Meet } from "@/lib/api/meet";

type Status = "idle" | "loading" | "ready" | "error";

type ActiveMeetsState = {
  /** The meetings running (or scheduled) in the user's conversations that they
      can join and are not already in. Refetched on every socket connect, which
      is the source of truth; there is no live start event. */
  items: Meet[];
  status: Status;
  load: () => Promise<void>;
  /** A meeting for this conversation, if one is live to join. */
  forConversation: (conversationId: string) => Meet | undefined;
};

export const useActiveMeets = create<ActiveMeetsState>((set, get) => ({
  items: [],
  status: "idle",
  load: async () => {
    if (get().status !== "loading") set({ status: "loading" });
    try {
      const items = await fetchActiveMeets();
      set({ items: Array.isArray(items) ? items : [], status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },
  forConversation: (conversationId) =>
    get().items.find((m) => m.conversationId === conversationId && !m.scheduledFor),
}));
