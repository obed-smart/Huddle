"use client";

import { useEffect } from "react";

import { useSocket } from "@/features/realtime/socket-provider";
import { useActiveMeets } from "@/stores/active-meets";

/** Keep the joinable-meets list fresh: load it whenever the socket connects and
    reconnects, the way the backend's GET /meet/active is the source of truth
    (there is no live meeting-started event to listen for). */
export function useActiveMeetsSync() {
  const socket = useSocket();
  const load = useActiveMeets((s) => s.load);

  useEffect(() => {
    if (!socket) return;
    void load();
    const onConnect = () => void load();
    socket.on("connect", onConnect);
    return () => {
      socket.off("connect", onConnect);
    };
  }, [socket, load]);
}
