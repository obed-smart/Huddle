"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff, UserPlus } from "lucide-react";

import { toast } from "@/lib/notify";
import { Avatar } from "@/components/ui/avatar";
import { useCall } from "./call-store";
import { useCallStreams } from "./call-streams";
import { callSession } from "./call-session";
import { CallControlButton } from "./call-control-button";
import { CallStatus } from "./call-status";
import { VideoTile } from "./video-tile";
import { CallPip } from "./call-pip";

const chip =
  "grid size-10 place-items-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70";

/** A one to one video call. The remote fills the screen and our own camera sits
    in a corner you can drag; tap the corner to swap them, tap the middle to hide
    the controls. While it connects, or when the other camera is off, we fall
    back to our own feed or their portrait, never a blank frame. */
export function VideoCallScreen() {
  const call = useCall((s) => s.call);
  const setMinimized = useCall((s) => s.setMinimized);
  const local = useCallStreams((s) => s.local);
  const remotes = useCallStreams((s) => s.remotes);
  const [swapped, setSwapped] = useState(false);
  const [bare, setBare] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMinimized(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMinimized]);

  if (!call) return null;
  const { peer, muted, camOn } = call;
  const active = call.phase === "active";
  const remoteCam = remotes.find((r) => r.kind === "cam")?.stream ?? null;
  const self = camOn && local ? local : null;

  // A live call with our camera on has a draggable corner that swaps with the
  // main view. The main surface shows the remote (their video, or their portrait
  // when their camera is off), or our own camera while connecting or swapped. The
  // corner holds whichever is not in the main view; a null stream means a portrait.
  const showPip = active && !!self;
  const mainSelf = !active || (showPip && swapped);
  const mainStream = mainSelf ? self : remoteCam;
  const pipStream = swapped ? remoteCam : self;

  const chrome = `transition-opacity ${bare ? "pointer-events-none opacity-0" : "opacity-100"}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video call with ${peer.name}`}
      className="relative size-full overflow-hidden bg-[#0b0b14] text-white"
    >
      <button
        type="button"
        onClick={() => setBare((b) => !b)}
        aria-label={bare ? "Show controls" : "Hide controls"}
        className="absolute inset-0 block size-full"
      >
        {mainStream ? (
          <VideoTile stream={mainStream} muted mirror={mainSelf} />
        ) : (
          <div className="grid size-full place-items-center">
            <Avatar src={peer.avatar} name={peer.name} className="size-28 text-3xl" />
          </div>
        )}
      </button>

      <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent ${chrome}`} />
      <div className={`pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 to-transparent ${chrome}`} />

      <header
        className={`absolute inset-x-0 top-0 flex items-start justify-between px-4 ${chrome}`}
        style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top))" }}
      >
        <button type="button" onClick={() => setMinimized(true)} aria-label="Minimize call" className={chip}>
          <ChevronDown className="size-6" />
        </button>
        <div className="flex flex-col items-center pt-1 text-center">
          <span className="font-display text-base font-semibold">{peer.name}</span>
          <CallStatus phase={call.phase} startedAt={call.startedAt} media={call.media} />
        </div>
        {active ? (
          <div className="flex flex-col items-end gap-3">
            <button type="button" onClick={() => toast("Inviting people is coming soon.")} aria-label="Add person" className={chip}>
              <UserPlus className="size-5.5" />
            </button>
            {camOn ? (
              <button type="button" onClick={() => callSession.flipCamera()} aria-label="Flip camera" className={chip}>
                <SwitchCamera className="size-5.5" />
              </button>
            ) : null}
          </div>
        ) : (
          <span className="size-10" aria-hidden />
        )}
      </header>

      {showPip ? (
        <CallPip onTap={() => setSwapped((s) => !s)}>
          {pipStream ? (
            <VideoTile stream={pipStream} muted mirror={!swapped} />
          ) : (
            <div className="grid size-full place-items-center bg-[#0b0b14]">
              <Avatar src={peer.avatar} name={peer.name} className="size-14 text-lg" />
            </div>
          )}
        </CallPip>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 px-6 pb-10 sm:gap-4 ${chrome}`}
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <CallControlButton icon={camOn ? <Video /> : <VideoOff />} srLabel={camOn ? "Turn camera off" : "Turn camera on"} active={!camOn} onClick={() => callSession.setCamera(!camOn)} />
        <CallControlButton variant="end" icon={<PhoneOff />} srLabel="End call" onClick={() => callSession.hangUp()} />
        <CallControlButton icon={muted ? <MicOff /> : <Mic />} srLabel={muted ? "Unmute" : "Mute"} active={muted} onClick={() => callSession.setMuted(!muted)} />
      </div>
    </div>
  );
}
