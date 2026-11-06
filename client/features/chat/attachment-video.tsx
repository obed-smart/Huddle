"use client";

import { useState } from "react";
import { Play, Loader2, Download } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Attachment as Att } from "@/lib/messages/types";
import { downloadFile } from "@/lib/media/download";
import { useAttachmentUrl } from "./use-attachment-url";
import { MediaLightbox } from "./media-lightbox";
import { formatDuration, formatSize } from "./attachment-ui";

/** A video in the transcript looks like a video, not a file: a dark tile with
    the first frame, a play badge, and its length. Received video loads on the
    first tap; the next tap opens the in-app player (with picture in picture). */
export function VideoAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const ready = mine || attachment.localOnly;
  const [loaded, setLoaded] = useState(ready);
  const { src, onError } = useAttachmentUrl(attachment, loaded);
  const [lightbox, setLightbox] = useState(false);
  const [wantPlay, setWantPlay] = useState(false);

  // One tap on a not-yet-loaded video loads it, then the player opens on its own
  // once the url is ready (derived, so there is no setState inside an effect).
  const playing = lightbox || (wantPlay && Boolean(src));

  function open() {
    if (src) setLightbox(true);
    else {
      setLoaded(true);
      setWantPlay(true);
    }
  }

  function close() {
    setLightbox(false);
    setWantPlay(false);
  }

  const duration = formatDuration(attachment.durationSeconds);
  const size = formatSize(attachment.size);
  const badge = [duration, size].filter(Boolean).join(" · ");

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`Play ${attachment.name}`}
        className="group relative block aspect-video w-64 max-w-full overflow-hidden rounded-xl bg-black"
      >
        {loaded && src ? (
          <video
            src={`${src}#t=0.1`}
            preload="metadata"
            muted
            playsInline
            onError={onError}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-foreground/25 to-foreground/10" />
        )}

        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-12 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-transform group-hover:scale-105">
            {wantPlay && !src ? <Loader2 className="size-6 animate-spin" /> : <Play className="size-6 fill-current" />}
          </span>
        </span>

        {badge ? (
          <span className="absolute bottom-2 left-2 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
            {badge}
          </span>
        ) : null}

        {loaded && src ? (
          <span
            role="button"
            tabIndex={0}
            aria-label="Save video"
            onClick={(e) => {
              e.stopPropagation();
              downloadFile(src, attachment.name);
            }}
            className={cn(
              "absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/45 text-white",
              "opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/60 group-hover:opacity-100",
            )}
          >
            <Download className="size-4" />
          </span>
        ) : null}
      </button>

      {src ? (
        <MediaLightbox open={playing} onClose={close} src={src} name={attachment.name} kind="video" />
      ) : null}
    </>
  );
}
