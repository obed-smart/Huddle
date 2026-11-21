"use client";

import { useEffect } from "react";

import type { AuthUser, Conversation } from "@/lib/contracts";
import { prefetchGroup } from "@/stores/groups";
import { usePeople, type Person } from "@/stores/people";

/**
 * Keep the people directory populated for whoever can appear in this
 * conversation, so a message carrying only a `senderId` can still show a name
 * and avatar. The signed-in user and a DM's other side come for free from what
 * we already hold; a group's members come from its details endpoint (groups
 * only, so DMs never call it).
 */
export function useConversationPeople(conversation: Conversation, me: AuthUser | null) {
  const merge = usePeople((s) => s.merge);
  const { id, type, otherUserId, name, avatar } = conversation;

  useEffect(() => {
    const seed: Person[] = [];
    if (me) {
      seed.push({ id: me.id, username: me.username, displayName: me.displayName, avatarUrl: me.avatarUrl });
    }
    if (type === "direct" && otherUserId) {
      seed.push({ id: otherUserId, displayName: name, avatarUrl: avatar });
    }
    if (seed.length) merge(seed);
  }, [type, otherUserId, name, avatar, me, merge]);

  // Warm the group cache in the background the moment the conversation opens, so
  // its name and members are ready (and cached for next time) before anything,
  // the call invite included, needs them. Caching and merging live in the store.
  useEffect(() => {
    if (type === "group") prefetchGroup(id);
  }, [id, type]);
}
