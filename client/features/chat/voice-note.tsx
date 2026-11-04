"use client";

import { useRef, useState, type SyntheticEvent } from "react";
import { Play, Pause, Mic } from "lucide-react";

import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** A compact voice-note player: a mic marker, a play/pause control, a progress
    line, and the time. The audio loads only when it is played, so nothing
    downloads on its own. */
export function VoiceNote({
  src,
  duration,
  mine,
}: {
  src: string;
  duration: number;
  mine: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration || 0);

  function toggle() {
    const el = audio.current;
    if (!el) return;
    if (playing) el.pause();
    else void el.play();
  }

  function onMeta(e: SyntheticEvent<HTMLAudioElement>) {
    const d = e.currentTarget.duration;
    if (Number.isFinite(d)) setTotal(d);
  }

  const fraction = total > 0 ? Math.min(1, current / total) : 0;
  const onBrand = mine ? "text-primary-foreground" : "text-foreground";
  const track = mine ? "bg-primary-foreground/30" : "bg-foreground/15";
  const fill = mine ? "bg-primary-foreground" : "bg-primary";

  return (
    <div className={cn("flex w-56 items-center gap-3", onBrand)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice note" : "Play voice note"}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-full",
          mine ? "bg-primary-foreground/20" : "bg-primary/10 text-primary",
        )}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Mic className="size-3 opacity-70" />
          <div className={cn("relative h-1 flex-1 overflow-hidden rounded-full", track)}>
            <div
              className={cn("absolute inset-y-0 left-0 rounded-full", fill)}
              style={{ width: `${fraction * 100}%` }}
            />
          </div>
        </div>
        <span className="mt-1 block text-[11px] opacity-80">
          {formatTime(playing || current ? current : total)}
        </span>
      </div>

      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
        onLoadedMetadata={onMeta}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
      />
    </div>
  );
}
