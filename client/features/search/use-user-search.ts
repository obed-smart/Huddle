"use client";

import { useEffect, useState } from "react";

import { sanitizeUsername, searchUsers, type SearchedUser } from "@/lib/api/users";

type Status = "idle" | "loading" | "ready" | "error";

/**
 * Debounced username search. State is only set from the timeout and the fetch
 * (never synchronously in the effect), so a fast typist fires one request per
 * pause, not one per keystroke.
 */
export function useUserSearch(query: string) {
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const q = sanitizeUsername(query);
    if (!q) {
      const clear = setTimeout(() => {
        setResults([]);
        setStatus("idle");
      }, 0);
      return () => clearTimeout(clear);
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setStatus("loading");
      searchUsers(q)
        .then((users) => {
          if (!cancelled) {
            setResults(Array.isArray(users) ? users : []);
            setStatus("ready");
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("error");
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, status };
}
