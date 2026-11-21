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
  /** Mark these ids present without a roster: whoever we subscribe to is in the
      call, which is the one presence signal every joiner gets (a late joiner is
      never sent a roster). Names arrive from the people directory or a roster. */
  addPresent: (ids: string[]) => void;
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
  addPresent: (ids) =>
    set((s) => {
      const byId = { ...s.byId };
      for (const id of ids)
        if (!byId[id]) byId[id] = { id, name: "", avatar: null, audioOn: true, videoOn: false };
      return { byId, present: Array.from(new Set([...s.present, ...ids])) };
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
