"use client";

import { MicOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { VideoTile } from "@/features/call/video-tile";

export type MeetTileModel = {
  id: string;
  name: string;
  avatar: string | null;
  stream: MediaStream | null;
  micOn: boolean;
  camOn: boolean;
  isLocal: boolean;
};

type Props = { tile: MeetTileModel; onClick?: () => void; big?: boolean; speaking?: boolean };

/** One participant surface in a meet: their shared camera or screen, else their
    portrait, with a name chip and a muted mark. Landscape, rounded, and filling
    whatever box it is placed in. */
export function MeetTile({ tile, onClick, big = false, speaking = false }: Props) {
  const show = tile.camOn && tile.stream;
  const label = tile.isLocal ? "You" : tile.name;
  const body = (
    <>
      {show ? (
        <VideoTile stream={tile.stream} muted mirror={tile.isLocal} />
      ) : (
        <div className="grid size-full place-items-center bg-[#15161c]">
          <Avatar src={tile.avatar} name={tile.name || "?"} className={big ? "size-24 text-3xl" : "size-14 text-lg"} />
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2 pt-6">
        {!tile.micOn ? <MicOff className="size-3.5 shrink-0 text-white/90" /> : null}
        <span className="truncate text-xs font-medium text-white/95">{label}</span>
      </div>
    </>
  );
  const ring = speaking ? "ring-2 ring-primary" : "ring-1 ring-white/5";
  const cls = `relative size-full overflow-hidden rounded-2xl bg-[#0c0d12] ${ring}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} block outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
