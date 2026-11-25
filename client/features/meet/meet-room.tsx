"use client";

import { useSession } from "@/stores/session";
import { useCallDuration } from "@/features/call/use-call-duration";
import { useMeet } from "./meet-store";
import { MeetStage } from "./meet-stage";
import { MeetControls } from "./meet-controls";
import { MeetPanel } from "./meet-panel";
import { ReactionFloat } from "./meet-reactions";
import type { MeetTileModel } from "./meet-tile";

/** The live meeting: the stage with everyone on it, the floating reactions, the
    control bar, and the people/chat panel (a column on desktop, a sheet on a
    phone). */
export function MeetRoom({ onLeave }: { onLeave: () => void }) {
  const user = useSession((s) => s.user);
  const { title, local, remotes, mic, cam, sharing, panel, pinnedId } = useMeet();
  const setPinned = useMeet((s) => s.setPinned);
  const joinedAt = useMeet((s) => s.joinedAt);
  const duration = useCallDuration(joinedAt);

  const localTile: MeetTileModel = {
    id: "local",
    name: user?.displayName || user?.username || "You",
    avatar: user?.avatarUrl ?? null,
    stream: local,
    micOn: mic,
    camOn: cam || sharing,
    isLocal: true,
  };
  const tiles: MeetTileModel[] = [localTile, ...remotes.map((r) => ({ ...r, isLocal: false }))];

  return (
    <div className="flex size-full flex-col bg-[#0b0c11] text-white">
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate font-display text-base font-semibold">{title}</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs tabular-nums">
            <span className="size-1.5 rounded-full bg-red-500" />
            {duration || "0:00"}
          </span>
        </div>
        <span className="text-xs text-white/70">{tiles.length} in the meeting</span>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <MeetStage tiles={tiles} pinnedId={pinnedId} sharing={sharing} onPin={setPinned} />
          <ReactionFloat />
          <div className="shrink-0 px-4 pb-5 pt-2" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}>
            <MeetControls onLeave={onLeave} />
          </div>
        </div>

        {panel !== "none" ? (
          <div className="absolute inset-0 z-30 bg-background md:static md:inset-auto md:z-auto md:w-80 md:bg-transparent">
            <MeetPanel tiles={tiles} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
