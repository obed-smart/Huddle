"use client";

import { useCallback, useEffect, useRef } from "react";

const MOBILE = "(max-width: 767px)";

/**
 * On a phone the open chat is a full screen over the list, but it is only React
 * state, so the hardware back button would pop the whole dashboard off history
 * and land on the login page. This adds a history entry when a chat opens on a
 * phone, so back returns to the list instead. The in-app back button goes
 * through the same entry, keeping history and the UI in step. Desktop, where
 * both panes show at once, is left alone.
 */
export function useChatHistory(
  selectedId: string | null,
  setSelectedId: (id: string | null) => void,
) {
  const openRef = useRef(selectedId !== null);

  useEffect(() => {
    openRef.current = selectedId !== null;
  }, [selectedId]);

  const open = useCallback(
    (id: string) => {
      const wasClosed = !openRef.current;
      setSelectedId(id);
      if (wasClosed && typeof window !== "undefined" && window.matchMedia(MOBILE).matches) {
        window.history.pushState({ huddleChat: true }, "");
      }
    },
    [setSelectedId],
  );

  const close = useCallback(() => {
    // Consume the pushed entry so history stays clean; on desktop (no entry)
    // just clear the selection.
    if (typeof window !== "undefined" && window.history.state?.huddleChat) {
      window.history.back();
    } else {
      setSelectedId(null);
    }
  }, [setSelectedId]);

  useEffect(() => {
    function onPop() {
      if (openRef.current) setSelectedId(null);
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setSelectedId]);

  return { open, close };
}
