import { create } from "zustand";

import { fetchPendingInvites } from "@/lib/api/requests";
import type { GroupInvite, PingRequest } from "@/lib/contracts";

export type { PingRequest };

type Status = "idle" | "loading" | "ready" | "error";

type RequestsState = {
  pings: PingRequest[];
  invites: GroupInvite[];
  status: Status;
  loadInvites: () => Promise<void>;
  addPing: (ping: PingRequest) => void;
  removePing: (conversationId: string) => void;
  removeInvite: (requestId: string) => void;
  reset: () => void;
};

export const useRequests = create<RequestsState>((set, get) => ({
  pings: [],
  invites: [],
  status: "idle",

  loadInvites: async () => {
    set({ status: "loading" });
    try {
      const data = await fetchPendingInvites();
      set({ invites: Array.isArray(data?.invites) ? data.invites : [], status: "ready" });
    } catch {
      set({ status: "error" });
    }
  },

  addPing: (ping) => {
    if (get().pings.some((p) => p.conversationId === ping.conversationId)) return;
    set((s) => ({ pings: [ping, ...s.pings] }));
  },

  removePing: (conversationId) =>
    set((s) => ({ pings: s.pings.filter((p) => p.conversationId !== conversationId) })),

  removeInvite: (requestId) =>
    set((s) => ({ invites: s.invites.filter((i) => i.id !== requestId) })),

  reset: () => set({ pings: [], invites: [], status: "idle" }),
}));
