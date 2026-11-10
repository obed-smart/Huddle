"use client";

import { useEffect } from "react";

import { useSocket } from "@/features/realtime/socket-provider";
import { callSession } from "./call-session";

/** Binds the live socket to the call session for as long as the app is signed
    in, so inbound calls and call events reach it. Renders nothing. Must live
    inside SocketProvider. */
export function CallController() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    callSession.attach(socket);
    return () => callSession.detach();
  }, [socket]);

  return null;
}
