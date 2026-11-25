"use client";

import { useEffect, useState } from "react";

import { MeetTile, type MeetTileModel } from "./meet-tile";

/** True on a wide viewport (desktop or a phone held sideways). */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 768px)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

// The grid only shows on a narrow screen (a wide one leads with the spotlight),
// so two columns is the most that stays legible on a phone.
function cols(n: number) {
  return n <= 1 ? 1 : 2;
}

type Props = {
  tiles: MeetTileModel[];
  pinnedId: string | null;
  sharing: boolean;
  onPin: (id: string | null) => void;
};

/** The meeting surface. Desktop leads with one large tile and a filmstrip of
    everyone else; mobile shows an even grid until you tap a tile to expand it.
    A pin (or a screen share) forces the spotlight on either. */
export function MeetStage({ tiles, pinnedId, sharing, onPin }: Props) {
  const wide = useWide();
  const spotlight = !!pinnedId || sharing || wide || tiles.length <= 1;

  if (!spotlight) {
    return (
      <div
        className="grid min-h-0 flex-1 gap-2 p-2"
        style={{ gridTemplateColumns: `repeat(${cols(tiles.length)}, minmax(0, 1fr))`, gridAutoRows: "minmax(0, 1fr)" }}
      >
        {tiles.map((t) => (
          <MeetTile key={t.id} tile={t} onClick={() => onPin(t.id)} />
        ))}
      </div>
    );
  }

  const main =
    tiles.find((t) => t.id === pinnedId) ??
    (sharing ? tiles.find((t) => t.isLocal) : null) ??
    tiles.find((t) => !t.isLocal) ??
    tiles[0];
  const others = tiles.filter((t) => t.id !== main.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
      <div className="min-h-0 flex-1">
        <MeetTile tile={main} big onClick={() => onPin(pinnedId ? null : main.id)} />
      </div>
      {others.length ? (
        <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
          {others.map((t) => (
            <div key={t.id} className="aspect-video w-36 shrink-0 sm:w-44">
              <MeetTile tile={t} onClick={() => onPin(t.id)} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
