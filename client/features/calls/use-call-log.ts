"use client";

import { useEffect, useState } from "react";

import { fetchCallLog } from "@/lib/api/calls";
import { ApiError } from "@/lib/api/http";
import type { CallLogEntry } from "@/lib/api/types";

type State = {
  entries: CallLogEntry[];
  status: "loading" | "ready" | "error";
  error: string | null;
};

/** Load the call log once when the Calls section is shown. Kept simple: a fresh
    fetch on mount, since a call log is small and read rarely. */
export function useCallLog() {
  const [state, setState] = useState<State>({ entries: [], status: "loading", error: null });

  useEffect(() => {
    let live = true;
    fetchCallLog()
      .then((entries) => {
        if (live) setState({ entries, status: "ready", error: null });
      })
      .catch((err) => {
        if (!live) return;
        const error = err instanceof ApiError ? err.message : "Could not load your calls.";
        setState({ entries: [], status: "error", error });
      });
    return () => {
      live = false;
    };
  }, []);

  return state;
}
