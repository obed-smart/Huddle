"use client";

import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Attachment as Att } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";
import { MediaLightbox } from "./media-lightbox";
import { DownloadButton, LoadButton, formatSize } from "./attachment-ui";

/** An image in the transcript. Received images arrive not downloaded (a tile
    with a download control) and load on tap, then open full screen in the
    in-app viewer. */
export function ImageAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const ready = mine || attachment.localOnly;
  const [loaded, setLoaded] = useState(ready);
  const { src, onError } = useAttachmentUrl(attachment, loaded);
  const [lightbox, setLightbox] = useState(false);
  const [imgReady, setImgReady] = useState(false);

  if (!loaded) {
    const size = formatSize(attachment.size);
    return (
      <div className="relative grid h-44 w-60 place-items-center overflow-hidden rounded-xl bg-foreground/10">
        <ImageIcon className="absolute size-9 text-foreground/15" />
        <LoadButton loading={false} onLoad={() => setLoaded(true)} dark={false} />
        {size ? <span className="absolute bottom-2 left-2 text-xs text-foreground/70">{size}</span> : null}
      </div>
    );
  }

  return (
    <div className="group relative inline-block max-w-[16rem] overflow-hidden rounded-xl bg-foreground/5">
      <button type="button" onClick={() => src && setLightbox(true)} className="block w-full">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={(el) => {
              if (el?.complete && el.naturalWidth > 0) setImgReady(true);
            }}
            src={src}
            alt={attachment.name}
            onLoad={() => setImgReady(true)}
            onError={onError}
            className={cn("max-h-72 w-full object-cover transition-opacity", imgReady ? "opacity-100" : "opacity-0")}
          />
        ) : null}
        {!imgReady ? (
          <div className="grid h-44 w-60 place-items-center text-muted-foreground">
            {src ? <Loader2 className="size-6 animate-spin" /> : <ImageIcon className="size-7" />}
          </div>
        ) : null}
      </button>
      {imgReady && src ? (
        <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
          <DownloadButton src={src} name={attachment.name} dark />
        </span>
      ) : null}
      {src ? (
        <MediaLightbox open={lightbox} onClose={() => setLightbox(false)} src={src} name={attachment.name} kind="image" />
      ) : null}
    </div>
  );
}
