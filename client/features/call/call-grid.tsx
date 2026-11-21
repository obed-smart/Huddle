"use client";

import { useEffect, useState } from "react";

import { CallTile } from "./call-tile";
import type { Tile } from "./use-call-tiles";

type Props = {
  tiles: Tile[];
  mode: "grid" | "speaker";
  primaryId: string;
  /** Promote a small tile to the stage (and switch to speaker view). */
  onSelect: (id: string) => void;
  /** Tapping the stage returns everyone to an equal grid. */
  onCollapse: () => void;
};

/** True on a wide viewport (desktop, or a phone held sideways), where tiles sit
    better side by side than stacked. */
function useWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(min-width: 640px), (orientation: landscape)");
    const on = () => setWide(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, []);
  return wide;
}

/** Columns for an equal grid: computed from the count (and width) so every cell
    is the same shape and only the number of them changes as people join. */
function columns(n: number, wide: boolean) {
  if (n <= 1) return 1;
  if (n === 2) return wide ? 2 : 1;
  if (n <= 6) return 2;
  return wide ? 4 : 3;
}

/** The multi-participant surface. An equal grid when nobody is spotlighted, or
    one large stage with a scrollable filmstrip of everyone else. Clears the
    header and the control row through padding, never fixed offsets. */
export function CallGrid({ tiles, mode, primaryId, onSelect, onCollapse }: Props) {
  const wide = useWide();

  if (mode === "grid") {
    return (
      <div
        className="absolute inset-0 grid gap-1.5 p-1.5"
        style={{
          gridTemplateColumns: `repeat(${columns(tiles.length, wide)}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(0, 1fr)",
          paddingTop: "max(5rem, calc(env(safe-area-inset-top) + 4rem))",
          paddingBottom: "7.5rem",
        }}
      >
        {tiles.map((t) => (
          <CallTile key={t.id} tile={t} onClick={() => onSelect(t.id)} />
        ))}
      </div>
    );
  }

  const main = tiles.find((t) => t.id === primaryId) ?? tiles[0];
  const others = tiles.filter((t) => t.id !== main.id);
  return (
    <>
      <button type="button" onClick={onCollapse} className="absolute inset-0 block size-full">
        <CallTile tile={main} rounded={false} hideLabel avatarClass="size-28 text-3xl" />
      </button>
      <div
        className="absolute inset-x-0 z-[6] flex gap-2 overflow-x-auto px-3"
        style={{ bottom: "7.5rem" }}
      >
        {others.map((t) => (
          <div key={t.id} className="aspect-[3/4] w-24 shrink-0">
            <CallTile tile={t} onClick={() => onSelect(t.id)} avatarClass="size-12 text-base" />
          </div>
        ))}
      </div>
    </>
  );
}
