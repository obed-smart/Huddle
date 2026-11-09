"use client";

import { Mic, MicOff, Volume2, VolumeX, UserPlus, Video, Phone, PhoneOff } from "lucide-react";

import { toast } from "@/lib/notify";
import type { CallPhase } from "./call-types";
import { CallControlButton } from "./call-control-button";

type Props = {
  phase: CallPhase;
  muted: boolean;
  speaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onAccept: () => void;
  onHangUp: () => void;
};

/** The bottom cluster. An incoming call offers decline and accept; every other
    phase shows the live controls over a single end button. Inviting others and
    switching to video are stubs for now; the real flows land with the backend. */
export function CallControls({
  phase,
  muted,
  speaker,
  onToggleMute,
  onToggleSpeaker,
  onAccept,
  onHangUp,
}: Props) {
  if (phase === "incoming") {
    return (
      <div className="flex items-end justify-center gap-20">
        <CallControlButton variant="end" icon={<PhoneOff />} label="Decline" onClick={onHangUp} />
        <CallControlButton variant="accept" icon={<Phone />} label="Accept" onClick={onAccept} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="flex items-center justify-center gap-4">
        <CallControlButton
          icon={muted ? <MicOff /> : <Mic />}
          srLabel={muted ? "Unmute" : "Mute"}
          active={muted}
          onClick={onToggleMute}
        />
        <CallControlButton
          icon={speaker ? <Volume2 /> : <VolumeX />}
          srLabel={speaker ? "Speaker off" : "Speaker on"}
          onClick={onToggleSpeaker}
        />
        <CallControlButton
          icon={<UserPlus />}
          srLabel="Add person"
          onClick={() => toast("Inviting people is coming soon.")}
        />
        <CallControlButton
          icon={<Video />}
          srLabel="Switch to video"
          onClick={() => toast("Switching to video is coming soon.")}
        />
      </div>
      <CallControlButton variant="end" icon={<PhoneOff />} label="End" onClick={onHangUp} />
    </div>
  );
}
