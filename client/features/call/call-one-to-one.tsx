"use client";

import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { VideoTile } from "./video-tile";
import { CallPip } from "./call-pip";
import type { CallPeer } from "./call-types";

type Props = {
  peer: CallPeer;
  active: boolean;
  self: MediaStream | null;
  remoteCam: MediaStream | null;
  onToggleChrome: () => void;
};

/** The one to one stage: the other person fills the screen and our own camera
    sits in a corner you can drag. Tap the corner to swap them; tap the middle to
    hide the controls. While it connects, or when a camera is off, it falls back
    to our own feed or a portrait, never a blank frame. */
export function CallOneToOne({ peer, active, self, remoteCam, onToggleChrome }: Props) {
  const [swapped, setSwapped] = useState(false);
  const showPip = active && !!self;
  const mainSelf = !active || (showPip && swapped);
  const mainStream = mainSelf ? self : remoteCam;
  const pipStream = swapped ? remoteCam : self;

  return (
    <>
      <button type="button" onClick={onToggleChrome} aria-label="Toggle controls" className="absolute inset-0 block size-full">
        {mainStream ? (
          <VideoTile stream={mainStream} muted mirror={mainSelf} />
        ) : (
          <div className="grid size-full place-items-center">
            <Avatar src={peer.avatar} name={peer.name} className="size-28 text-3xl" />
          </div>
        )}
      </button>

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
    </>
  );
}
