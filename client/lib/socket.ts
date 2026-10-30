import { io, type Socket } from "socket.io-client";

import { API_BASE } from "@/lib/api/config";

let socket: Socket | null = null;

/**
 * Open the authenticated socket. `withCredentials` sends the httpOnly session
 * cookie on the handshake — there is no token to pass. Guarded so a second
 * call never opens a duplicate (which would double every delivered message).
 */
export function connectSocket(): Socket | null {
  if (socket) return socket;
  if (typeof window === "undefined") return null;
  socket = io(API_BASE || undefined, { withCredentials: true });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

/** Close the authenticated socket on sign-out so another account's events
    don't keep arriving. */
export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } catch {
    // Signing out must not depend on the socket closing cleanly.
  }
  socket = null;
}
