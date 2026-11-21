"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Mic, MicOff, Video, VideoOff, SwitchCamera, PhoneOff, UserPlus, LayoutGrid, SquareUser } from "lucide-react";

import { useCall } from "./call-store";
import { useCallStreams } from "./call-streams";
import { callSession } from "./call-session";
import { useCallTiles } from "./use-call-tiles";
import { CallControlButton } from "./call-control-button";
import { CallStatus } from "./call-status";
import { CallOneToOne } from "./call-one-to-one";
import { CallGrid } from "./call-grid";
import { CallInviteSheet } from "./call-invite-sheet";

const chip =
  "grid size-10 place-items-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm outline-none transition-transform duration-150 active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70";

/** A video call. One to one keeps the draggable self-view; the moment a second
    person is on it becomes a group, with an equal grid and a speaker view you
    reach by tapping any tile (and leave by tapping the big one). */
export function VideoCallScreen() {
  const call = useCall((s) => s.call);
  const setMinimized = useCall((s) => s.setMinimized);
  const local = useCallStreams((s) => s.local);
  const remotes = useCallStreams((s) => s.remotes);
  const tiles = useCallTiles();
  const [bare, setBare] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [layout, setLayout] = useState<"grid" | "speaker">("grid");
  const [primaryId, setPrimaryId] = useState("");

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
  const remoteTiles = tiles.filter((t) => !t.isLocal);
  const group = remoteTiles.length >= 2;
  const count = remoteTiles.length + 1;
  const remoteCam = remotes.find((r) => r.kind === "cam")?.stream ?? null;
  const self = camOn && local ? local : null;

  function promote(id: string) {
    setPrimaryId(id);
    setLayout("speaker");
  }

  const chrome = `transition-opacity ${bare && !group ? "pointer-events-none opacity-0" : "opacity-100"}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Video call with ${peer.name}`}
      className="relative size-full overflow-hidden bg-[#0b0b14] text-white"
    >
      {group ? (
        <CallGrid
          tiles={tiles}
          mode={layout}
          primaryId={primaryId || remoteTiles[0]?.id || ""}
          onSelect={promote}
          onCollapse={() => setLayout("grid")}
        />
      ) : (
        <CallOneToOne peer={peer} active={active} self={self} remoteCam={remoteCam} onToggleChrome={() => setBare((b) => !b)} />
      )}

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
          <div className="flex items-center gap-1.5">
            <CallStatus phase={call.phase} startedAt={call.startedAt} media={call.media} />
            {group ? <span className="text-sm text-white/60">· {count} people</span> : null}
          </div>
        </div>
        {active ? (
          <div className="flex flex-col items-end gap-3">
            <button type="button" onClick={() => setInviteOpen(true)} aria-label="Add person" className={chip}>
              <UserPlus className="size-5.5" />
            </button>
            {group ? (
              <button
                type="button"
                onClick={() => (layout === "grid" ? promote(remoteTiles[0]?.id || "") : setLayout("grid"))}
                aria-label={layout === "grid" ? "Speaker view" : "Grid view"}
                className={chip}
              >
                {layout === "grid" ? <SquareUser className="size-5.5" /> : <LayoutGrid className="size-5.5" />}
              </button>
            ) : camOn ? (
              <button type="button" onClick={() => callSession.flipCamera()} aria-label="Flip camera" className={chip}>
                <SwitchCamera className="size-5.5" />
              </button>
            ) : null}
          </div>
        ) : (
          <span className="size-10" aria-hidden />
        )}
      </header>

      <div
        className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 px-6 pb-10 sm:gap-4 ${chrome}`}
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <CallControlButton icon={camOn ? <Video /> : <VideoOff />} srLabel={camOn ? "Turn camera off" : "Turn camera on"} active={!camOn} onClick={() => callSession.setCamera(!camOn)} />
        <CallControlButton variant="end" icon={<PhoneOff />} srLabel="End call" onClick={() => callSession.hangUp()} />
        <CallControlButton icon={muted ? <MicOff /> : <Mic />} srLabel={muted ? "Unmute" : "Mute"} active={muted} onClick={() => callSession.setMuted(!muted)} />
      </div>

      <CallInviteSheet conversationId={call.conversationId} open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </div>
  );
}
