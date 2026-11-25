"use client";

import { useState, type ReactNode } from "react";
import { Mic, MicOff, Video, VideoOff, MonitorUp, Smile, Users, MessageSquare, PhoneOff } from "lucide-react";

import { useMeet } from "./meet-store";
import { meetMedia } from "./meet-media";
import { ReactionBar } from "./meet-reactions";

function Ctrl({ on = true, danger = false, active = false, label, onClick, children }: { on?: boolean; danger?: boolean; active?: boolean; label: string; onClick: () => void; children: ReactNode }) {
  const tone = danger
    ? "bg-red-500 text-white hover:bg-red-600"
    : active
      ? "bg-primary text-primary-foreground"
      : on
        ? "bg-white/10 text-white hover:bg-white/20"
        : "bg-red-500/90 text-white hover:bg-red-500";
  return (
    <button type="button" onClick={onClick} aria-label={label} className={`grid size-12 place-items-center rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 ${tone}`}>
      {children}
    </button>
  );
}

/** The floating control bar: devices, screen share, reactions, the side panels,
    and leave. Toggling a device drives the local media directly. */
export function MeetControls({ onLeave }: { onLeave: () => void }) {
  const { mic, cam, sharing, panel } = useMeet();
  const togglePanel = useMeet((s) => s.togglePanel);
  const react = useMeet((s) => s.react);
  const [picker, setPicker] = useState(false);

  return (
    <div className="relative flex items-center justify-center gap-2 sm:gap-3">
      {picker ? (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2">
          <ReactionBar
            onPick={(e) => {
              react(e);
              setPicker(false);
            }}
          />
        </div>
      ) : null}

      <Ctrl on={mic} label={mic ? "Mute" : "Unmute"} onClick={() => meetMedia.toggleMic()}>
        {mic ? <Mic className="size-5" /> : <MicOff className="size-5" />}
      </Ctrl>
      <Ctrl on={cam} label={cam ? "Turn camera off" : "Turn camera on"} onClick={() => meetMedia.toggleCam()}>
        {cam ? <Video className="size-5" /> : <VideoOff className="size-5" />}
      </Ctrl>
      <Ctrl active={sharing} label={sharing ? "Stop sharing" : "Share screen"} onClick={() => meetMedia.toggleShare()}>
        <MonitorUp className="size-5" />
      </Ctrl>
      <Ctrl active={picker} label="React" onClick={() => setPicker((p) => !p)}>
        <Smile className="size-5" />
      </Ctrl>
      <Ctrl active={panel === "people"} label="Participants" onClick={() => togglePanel("people")}>
        <Users className="size-5" />
      </Ctrl>
      <Ctrl active={panel === "chat"} label="Chat" onClick={() => togglePanel("chat")}>
        <MessageSquare className="size-5" />
      </Ctrl>
      <Ctrl danger label="Leave" onClick={onLeave}>
        <PhoneOff className="size-5" />
      </Ctrl>
    </div>
  );
}
