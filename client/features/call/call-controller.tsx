"use client";

import { useEffect, useRef } from "react";

import { useSocket } from "@/features/realtime/socket-provider";
import { callSession } from "./call-session";
import { useCall } from "./call-store";

/** Binds the live socket to the call session for as long as the app is signed
    in, so inbound calls and call events reach it. Also pauses our camera while
    the tab is hidden: a backgrounded tab freezes its camera, so the far side
    would see our last frame stuck; closing it shows our avatar instead, and we
    bring it back on return. Renders nothing. Must live inside SocketProvider. */
export function CallController() {
  const socket = useSocket();
  const resumeCamera = useRef(false);

  useEffect(() => {
    if (!socket) return;
    callSession.attach(socket);
    return () => callSession.detach();
  }, [socket]);

  useEffect(() => {
    function onVisibility() {
      const call = useCall.getState().call;
      if (document.hidden) {
        if (call?.phase === "active" && call.media === "video" && call.camOn) {
          callSession.setCamera(false);
          resumeCamera.current = true;
        }
      } else if (resumeCamera.current) {
        resumeCamera.current = false;
        if (useCall.getState().call?.phase === "active") callSession.setCamera(true);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return null;
}
