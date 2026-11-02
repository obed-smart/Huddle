"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchGroupDetails, type GroupDetails } from "@/lib/api/group";

/** Load a group's details (and participants) when the info screen opens, with a
    reload for after a mutation. State is only set from the fetch callbacks. */
export function useGroupInfo(conversationId: string, open: boolean) {
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !conversationId) return;
    let cancelled = false;
    fetchGroupDetails(conversationId)
      .then((g) => {
        if (!cancelled) {
          setGroup(g);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, conversationId]);

  const reload = useCallback(() => {
    fetchGroupDetails(conversationId)
      .then((g) => {
        setGroup(g);
        setError(false);
      })
      .catch(() => setError(true));
  }, [conversationId]);

  const isAdmin = group ? group.myRole === "admin" || group.myRole === "super_admin" : false;

  return { group, error, reload, isAdmin };
}
