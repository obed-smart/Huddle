"use client";

import { Mic, MicOff, Video, VideoOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { VideoTile } from "@/features/call/video-tile";
import { useSession } from "@/stores/session";
import { useMeet } from "./meet-store";
import { meetMedia } from "./meet-media";

/** The pre-join screen: check your camera and mic, flip either off, then join.
    Mirrors Google Meet's green room so you are never surprised on the way in. */
export function MeetLobby() {
  const user = useSession((s) => s.user);
  const { title, local, mic, cam } = useMeet();
  const join = useMeet((s) => s.join);
  const name = user?.displayName || user?.username || "You";

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 p-6">
      <div className="relative aspect-video w-full max-w-xl overflow-hidden rounded-3xl bg-[#0c0d12] shadow-xl">
        {cam && local ? (
          <VideoTile stream={local} muted mirror />
        ) : (
          <div className="grid size-full place-items-center">
            <Avatar src={user?.avatarUrl} name={name} className="size-24 text-3xl" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/50 to-transparent pb-4 pt-10">
          <button
            type="button"
            onClick={() => meetMedia.toggleMic()}
            aria-label={mic ? "Mute" : "Unmute"}
            className={`grid size-11 place-items-center rounded-full transition-transform active:scale-95 ${mic ? "bg-white/15 text-white hover:bg-white/25" : "bg-red-500 text-white"}`}
          >
            {mic ? <Mic className="size-5" /> : <MicOff className="size-5" />}
          </button>
          <button
            type="button"
            onClick={() => meetMedia.toggleCam()}
            aria-label={cam ? "Turn camera off" : "Turn camera on"}
            className={`grid size-11 place-items-center rounded-full transition-transform active:scale-95 ${cam ? "bg-white/15 text-white hover:bg-white/25" : "bg-red-500 text-white"}`}
          >
            {cam ? <Video className="size-5" /> : <VideoOff className="size-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-sm text-white/60">Ready to join?</p>
      </div>

      <button
        type="button"
        onClick={join}
        className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform active:scale-95"
      >
        Join now
      </button>
    </div>
  );
}
