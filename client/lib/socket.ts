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

/** What the server answers an emit with: `{ success, message, data }`. On the
    send path `message` carries the new message id on success. */
export type Ack = {
  success?: boolean;
  message?: string;
  data?: { id?: string; messageId?: string } | null;
};

function toAck(value: unknown): Ack {
  if (value && typeof value === "object") return value as Ack;
  if (typeof value === "string") return { success: true, message: value };
  return { success: true };
}

/**
 * Emit and await the server's acknowledgement. Never rejects: a dead socket or
 * a timeout resolves to `{ success: false }` so callers settle a sent message
 * as failed rather than hanging on a promise that never lands.
 */
export function emitWithAck(event: string, payload: unknown, timeoutMs = 8000): Promise<Ack> {
  const s = socket;
  if (!s) return Promise.resolve({ success: false, message: "Not connected" });

  return new Promise((resolve) => {
    let settled = false;
    const done = (ack: Ack) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ack);
    };
    const timer = setTimeout(() => done({ success: false, message: "Timed out" }), timeoutMs);
    try {
      s.emit(event, payload, (ack: unknown) => done(toAck(ack)));
    } catch {
      done({ success: false, message: "Could not send" });
    }
  });
}

/**
 * Run `handler` now if the socket is already up, and again on every (re)connect.
 * Rejoining a conversation room on reconnect is what keeps messages arriving
 * after the network blips. Returns an unsubscribe.
 */
export function onSocketConnected(handler: () => void): () => void {
  const s = socket;
  if (!s) return () => {};
  if (s.connected) handler();
  s.on("connect", handler);
  return () => {
    s.off("connect", handler);
  };
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
