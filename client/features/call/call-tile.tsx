"use client";

import { MicOff } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { VideoTile } from "./video-tile";
import type { Tile } from "./use-call-tiles";

type Props = {
  tile: Tile;
  /** Round the corners (a grid cell or a filmstrip card) or fill square (the
      spotlight stage). */
  rounded?: boolean;
  /** Drop the name bar (the spotlight stage, where it would sit under the
      controls and the header already names the call). */
  hideLabel?: boolean;
  onClick?: () => void;
  avatarClass?: string;
};

/** One participant rectangle: their camera if we have it, otherwise their
    portrait, with a name bar and a muted-mic mark along the bottom. */
export function CallTile({ tile, rounded = true, hideLabel = false, onClick, avatarClass = "size-20 text-2xl" }: Props) {
  const label = hideLabel ? "" : tile.isLocal ? "You" : tile.name;
  const body = (
    <>
      {tile.stream ? (
        <VideoTile stream={tile.stream} muted mirror={tile.isLocal} />
      ) : (
        <div className="grid size-full place-items-center bg-[#15151f]">
          <Avatar src={tile.avatar} name={tile.name || "?"} className={avatarClass} />
        </div>
      )}
      {label ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-6">
          {tile.muted ? <MicOff className="size-3.5 shrink-0 text-white/90" /> : null}
          <span className="truncate text-xs font-medium text-white/90">{label}</span>
        </div>
      ) : null}
    </>
  );
  const cls = `relative size-full overflow-hidden bg-[#0b0b14] ${rounded ? "rounded-2xl" : ""}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} block outline-none focus-visible:ring-2 focus-visible:ring-white/70`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}
