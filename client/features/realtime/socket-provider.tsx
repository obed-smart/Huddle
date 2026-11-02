"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Socket } from "socket.io-client";

import { connectSocket, disconnectSocket } from "@/lib/socket";
import { useSession } from "@/stores/session";

const SocketContext = createContext<Socket | null>(null);

/**
 * Owns the single socket instance for the whole app: it connects when the
 * session becomes authed and disconnects on sign-out, and hands the instance
 * down through context so consumers re-render the moment it is available.
 * Mounted once at the root — never per feature, never in a component that
 * remounts — so there is exactly one connection and reconnection is central.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const authed = useSession((s) => s.status === "authed");
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!authed) return;
    const instance = connectSocket();
    // Deferred so it is not a synchronous setState inside the effect body.
    const id = setTimeout(() => setSocket(instance), 0);
    return () => {
      clearTimeout(id);
      disconnectSocket();
      setSocket(null);
    };
  }, [authed]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

/** The live socket, or null until the session is authed and connected. */
export function useSocket() {
  return useContext(SocketContext);
}
