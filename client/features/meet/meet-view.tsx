"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useMeet } from "./meet-store";
import { meetMedia, mediaSupported } from "./meet-media";
import { MeetLobby } from "./meet-lobby";
import { MeetRoom } from "./meet-room";

/** The whole meet experience for one meeting id: open the camera, show the
    lobby, then the room once joined. Leaving tears the media down and returns
    to the dashboard. Signaling (join, publish, subscribe over the SFU) will
    drive the remote participants on top of this. */
export function MeetView({ title }: { meetId: string; title?: string }) {
  const phase = useMeet((s) => s.phase);
  const setTitle = useMeet((s) => s.setTitle);
  const router = useRouter();

  useEffect(() => {
    if (title) setTitle(title);
    if (mediaSupported()) void meetMedia.open();
    return () => meetMedia.leave();
  }, [title, setTitle]);

  function leave() {
    meetMedia.leave();
    router.push("/dashboard");
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0c11] text-white">
      {phase === "lobby" ? <MeetLobby /> : <MeetRoom onLeave={leave} />}
    </div>
  );
}
