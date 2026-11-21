import { create } from "zustand";

import type { RosterParticipant } from "./signaling/types";

/** One person in the call, as the grid needs them: who they are, and their
    last known mic and camera state. Streams live in the streams store; this is
    only the metadata the tiles draw around them. */
export type CallParticipant = {
  id: string;
  name: string;
  avatar: string | null;
  audioOn: boolean;
  videoOn: boolean;
};

type Store = {
  /** Everyone we have ever learned about this call, by id. A lookup, so it only
      grows; who is actually present is `present`. */
  byId: Record<string, CallParticipant>;
  /** The ids the latest roster listed as in the call (includes ourselves). */
  present: string[];
  applyRoster: (list: RosterParticipant[]) => void;
  /** Fill in names and avatars from the group members, without claiming anyone
      is present. Never overwrites a name the roster already gave us. */
  addNames: (people: { id: string; name: string; avatar: string | null }[]) => void;
  clear: () => void;
};

export const useCallParticipants = create<Store>((set) => ({
  byId: {},
  present: [],
  applyRoster: (list) =>
    set((s) => {
      const byId = { ...s.byId };
      for (const p of list) {
        byId[p.userId] = {
          id: p.userId,
          name: p.username || byId[p.userId]?.name || "",
          avatar: p.avatarUrl ?? byId[p.userId]?.avatar ?? null,
          audioOn: p.audioOn ?? true,
          videoOn: p.videoOn ?? !!p.tracks?.cam,
        };
      }
      return { byId, present: list.map((p) => p.userId) };
    }),
  addNames: (people) =>
    set((s) => {
      const byId = { ...s.byId };
      for (const p of people) {
        const prev = byId[p.id];
        byId[p.id] = {
          id: p.id,
          name: prev?.name || p.name,
          avatar: prev?.avatar ?? p.avatar,
          audioOn: prev?.audioOn ?? true,
          videoOn: prev?.videoOn ?? false,
        };
      }
      return { byId };
    }),
  clear: () => set({ byId: {}, present: [] }),
}));
