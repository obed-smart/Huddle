"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSocket } from "@/features/realtime/socket-provider";
import { useMeet } from "./meet-store";
import { meetMedia, mediaSupported } from "./meet-media";
import { meetSignaling } from "./meet-signaling";
import { MeetLobby } from "./meet-lobby";
import { MeetRoom } from "./meet-room";

/** The whole meet experience for one meeting id: open the camera, show the
    lobby, then the room once joined. Joining runs the SFU handshake (join,
    publish, subscribe); leaving tears media and signaling down. */
export function MeetView({ meetId, conversationId = "", title }: { meetId: string; conversationId?: string; title?: string }) {
  const phase = useMeet((s) => s.phase);
  const hasLocal = useMeet((s) => !!s.local);
  const setTitle = useMeet((s) => s.setTitle);
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (title) setTitle(title);
    if (mediaSupported()) void meetMedia.open();
    return () => {
      meetSignaling.leave();
      meetMedia.leave();
    };
  }, [title, setTitle]);

  useEffect(() => {
    if (socket) meetSignaling.attach(socket);
    return () => meetSignaling.detach();
  }, [socket]);

  // The lobby flips the phase; that is our cue to run the join handshake, once
  // the camera is actually open (tapping Join before it is ready is common).
  // join() guards against running twice.
  useEffect(() => {
    if (phase === "joined" && hasLocal) void meetSignaling.join(meetId, conversationId);
  }, [phase, hasLocal, meetId, conversationId]);

  function leave() {
    meetSignaling.leave();
    meetMedia.leave();
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c11] text-white">
      {phase === "lobby" ? <MeetLobby /> : <MeetRoom onLeave={leave} />}
    </div>
  );
}
