"use client";

import { useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { MESSAGE_TYPES, type Attachment as Att } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";
import { MediaGallery } from "./media-gallery";
import { ChatAttachment } from "./attachment-preview";
import { LoadButton } from "./attachment-ui";

/** Lay out a message's attachments. Two or more images become a WhatsApp style
    album grid; a lone image or any other file stacks on its own. */
export function MessageAttachments({ attachments, mine }: { attachments: Att[]; mine: boolean }) {
  const images = attachments.filter((a) => a.type === MESSAGE_TYPES.IMAGE);
  const rest = attachments.filter((a) => a.type !== MESSAGE_TYPES.IMAGE);

  return (
    <div className="flex flex-col gap-1">
      {images.length >= 2 ? (
        <ImageAlbum images={images} mine={mine} />
      ) : (
        images.map((a) => <ChatAttachment key={a.id} attachment={a} mine={mine} />)
      )}
      {rest.map((a) => <ChatAttachment key={a.id} attachment={a} mine={mine} />)}
    </div>
  );
}

/** The album grid: up to four tiles, the fourth carrying a "+N" when there are
    more. Received albums load as one unit behind a single download control. */
function ImageAlbum({ images, mine }: { images: Att[]; mine: boolean }) {
  const [loaded, setLoaded] = useState(mine || images.every((i) => i.localOnly));
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!loaded) return <AlbumGate count={images.length} onLoad={() => setLoaded(true)} />;

  const tiles = images.slice(0, 4);
  const extra = images.length - tiles.length;
  const three = images.length === 3;

  return (
    <>
      <div
        className={cn(
          "grid w-64 grid-cols-2 gap-0.5 overflow-hidden rounded-lg",
          images.length > 2 ? "grid-rows-2" : "",
        )}
      >
        {tiles.map((img, i) => (
          <AlbumTile
            key={img.id}
            image={img}
            onOpen={() => setOpenIndex(i)}
            extra={i === tiles.length - 1 ? extra : 0}
            className={cn("col-span-1", three && i === 0 ? "row-span-2" : "aspect-square")}
          />
        ))}
      </div>
      <MediaGallery
        items={images}
        start={openIndex ?? 0}
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}

function AlbumTile({
  image,
  onOpen,
  extra,
  className,
}: {
  image: Att;
  onOpen: () => void;
  extra: number;
  className?: string;
}) {
  const { src, onError } = useAttachmentUrl(image, true);
  const [ready, setReady] = useState(false);

  return (
    <button type="button" onClick={onOpen} className={cn("relative block overflow-hidden bg-foreground/10", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) setReady(true);
          }}
          src={src}
          alt={image.name}
          onLoad={() => setReady(true)}
          onError={onError}
          className={cn("size-full object-cover transition-opacity", ready ? "opacity-100" : "opacity-0")}
        />
      ) : null}
      {!ready ? (
        <span className="absolute inset-0 grid place-items-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </span>
      ) : null}
      {extra > 0 ? (
        <span className="absolute inset-0 grid place-items-center bg-black/55 text-xl font-semibold text-white">
          +{extra}
        </span>
      ) : null}
    </button>
  );
}

/** The not-downloaded album placeholder: one tile, a count, and a load control. */
function AlbumGate({ count, onLoad }: { count: number; onLoad: () => void }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="relative grid h-44 w-64 place-items-center overflow-hidden rounded-lg bg-foreground/10">
      <ImageIcon className="absolute size-9 text-foreground/15" />
      <LoadButton
        loading={loading}
        onLoad={() => {
          setLoading(true);
          onLoad();
        }}
        dark={false}
      />
      <span className="absolute bottom-2 left-2 text-xs text-foreground/70">{count} photos</span>
    </div>
  );
}
