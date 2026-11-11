"use client";

import { Mic, MicOff, Volume2, VolumeX, Video, Phone, PhoneOff } from "lucide-react";

import type { CallPhase } from "./call-types";
import { CallControlButton } from "./call-control-button";

type Props = {
  phase: CallPhase;
  muted: boolean;
  speaker: boolean;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
  onSwitch: () => void;
  onAccept: () => void;
  onHangUp: () => void;
};

/** The bottom cluster. An inbound ring expanded to the full screen offers
    decline and accept; every other phase shows the live controls over a single
    end button. The video button upgrades the call to video once connected. */
export function CallControls({
  phase,
  muted,
  speaker,
  onToggleMute,
  onToggleSpeaker,
  onSwitch,
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

  // The mode switch is only available once connected: while the call is still
  // ringing it stays muted (disabled), the same rule the video UI will follow.
  const canSwitch = phase === "active";

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
          icon={<Video />}
          srLabel="Switch to video"
          disabled={!canSwitch}
          onClick={onSwitch}
        />
      </div>
      <CallControlButton variant="end" icon={<PhoneOff />} label="End" onClick={onHangUp} />
    </div>
  );
}
