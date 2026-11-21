import { create } from "zustand";

import type { GroupDetails } from "@/lib/contracts";
import { fetchGroupDetails } from "@/lib/api/group";
import { usePeople } from "./people";

type GroupsState = {
  byId: Record<string, GroupDetails>;
  put: (group: GroupDetails) => void;
};

/** A session cache of group details (name, avatar, participants), so opening a
    conversation a second time, or reaching for the member list in a call, is
    instant instead of a fresh round trip. Prefetched when a conversation opens.*/
export const useGroups = create<GroupsState>((set) => ({
  byId: {},
  put: (group) => set((s) => ({ byId: { ...s.byId, [group.id]: group } })),
}));

/** Requests in flight, so concurrent callers for the same group share one. */
const inflight = new Map<string, Promise<GroupDetails>>();

function absorb(group: GroupDetails) {
  useGroups.getState().put(group);
  usePeople.getState().merge(
    group.participants.map((p) => ({ id: p.id, username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl })),
  );
}

/** Hit the network and refresh the cache (and the people directory). */
export function refreshGroup(id: string): Promise<GroupDetails> {
  const pending = inflight.get(id);
  if (pending) return pending;
  const p = fetchGroupDetails(id)
    .then((group) => {
      absorb(group);
      return group;
    })
    .finally(() => inflight.delete(id));
  inflight.set(id, p);
  return p;
}

/** The cached details if we have them, otherwise fetch once and cache. */
export function ensureGroup(id: string): Promise<GroupDetails> {
  const cached = useGroups.getState().byId[id];
  return cached ? Promise.resolve(cached) : refreshGroup(id);
}

/** Warm the cache in the background; failures are ignored. */
export function prefetchGroup(id: string) {
  void refreshGroup(id).catch(() => {});
}
