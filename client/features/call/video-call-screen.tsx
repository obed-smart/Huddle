"use client";

import { useEffect } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Repeat, PhoneOff, UserPlus } from "lucide-react";

import { toast } from "@/lib/notify";
import { Avatar } from "@/components/ui/avatar";
import { useCall } from "./call-store";
import { useCallStreams } from "./call-streams";
import { callSession } from "./call-session";
import { CallControlButton } from "./call-control-button";
import { CallStatus } from "./call-status";
import { VideoTile } from "./video-tile";

const chip =
  "grid size-10 place-items-center rounded-full bg-black/30 text-white/90 backdrop-blur-sm outline-none transition-transform duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70";

/** A one to one video call: the other person fills the screen, your camera sits
    in a corner, the controls float over the video. Before the remote video
    arrives you see your own camera (or your portrait if the camera is off). */
export function VideoCallScreen() {
  const call = useCall((s) => s.call);
  const setMinimized = useCall((s) => s.setMinimized);
  const local = useCallStreams((s) => s.local);
  const remotes = useCallStreams((s) => s.remotes);
  const phase = call?.phase;

  useEffect(() => {
    if (!phase) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMinimized(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, setMinimized]);

  if (!call) return null;
  const { peer, muted, camOn, speaker } = call;
  const remoteCam = remotes.find((r) => r.kind === "cam")?.stream ?? null;
  const active = call.phase === "active";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video call with ${peer.name}`}
      className="relative size-full overflow-hidden bg-[#0b0b14] text-white"
    >
      <div className="absolute inset-0">
        {remoteCam ? (
          <VideoTile stream={remoteCam} />
        ) : camOn && local ? (
          <VideoTile stream={local} muted mirror />
        ) : (
          <div className="grid size-full place-items-center">
            <Avatar src={peer.avatar} name={peer.name} className="size-28 text-3xl" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <header
        className="absolute inset-x-0 top-0 flex items-start justify-between px-4"
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize call" className={chip}>
          <ChevronDown className="size-6" />
        </button>
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="font-display text-base font-semibold">{peer.name}</span>
          <CallStatus phase={call.phase} startedAt={call.startedAt} />
        </div>
        {active ? (
          <button type="button" onClick={() => toast("Inviting people is coming soon.")} aria-label="Add person" className={chip}>
            <UserPlus className="size-5.5" />
          </button>
        ) : (
          <span className="size-10" aria-hidden />
        )}
      </header>

      {remoteCam && local ? (
        <div className="absolute right-4 top-24 h-40 w-28 overflow-hidden rounded-2xl border border-white/15 bg-black/50 shadow-xl">
          {camOn ? (
            <VideoTile stream={local} muted mirror />
          ) : (
            <div className="grid size-full place-items-center">
              <VideoOff className="size-6 text-white/60" />
            </div>
          )}
        </div>
      ) : null}

      <div
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-6 px-6 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-center gap-4">
          <CallControlButton icon={muted ? <MicOff /> : <Mic />} srLabel={muted ? "Unmute" : "Mute"} active={muted} onClick={() => callSession.setMuted(!muted)} />
          <CallControlButton icon={camOn ? <Video /> : <VideoOff />} srLabel={camOn ? "Turn camera off" : "Turn camera on"} active={!camOn} onClick={() => callSession.setCamera(!camOn)} />
          <CallControlButton icon={<Repeat />} srLabel="Switch to audio" onClick={() => toast("Switching is coming soon.")} />
          <CallControlButton icon={speaker ? <Volume2 /> : <VolumeX />} srLabel="Speaker" onClick={() => callSession.setSpeaker(!speaker)} />
        </div>
        <CallControlButton variant="end" icon={<PhoneOff />} label="End" onClick={() => callSession.hangUp()} />
      </div>
    </div>
  );
}
