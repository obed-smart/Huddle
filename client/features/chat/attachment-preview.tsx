"use client";

import { useState } from "react";
import { FileText, Play, ImageIcon, Loader2, Mic } from "lucide-react";

import { cn } from "@/lib/utils";
import { MESSAGE_TYPES, type Attachment as Att } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";
import { VoiceNote } from "./voice-note";
import { MediaLightbox } from "./media-lightbox";
import { Card, DownloadButton, LoadButton, formatSize } from "./attachment-ui";

/** One attachment in a bubble. Received media stays "not downloaded" until the
    viewer taps the download control; then images and video open an in-app
    viewer, voice notes play inline, and files offer a save. Nothing opens a tab. */
export function ChatAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const ready = mine || attachment.localOnly;
  const [loaded, setLoaded] = useState(ready);
  const { src, onError } = useAttachmentUrl(attachment, loaded);
  const [lightbox, setLightbox] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const meta = formatSize(attachment.size);

  if (!loaded) {
    return <DownloadGate attachment={attachment} mine={mine} meta={meta} onLoad={() => setLoaded(true)} />;
  }

  if (attachment.type === MESSAGE_TYPES.AUDIO) {
    return src ? (
      <VoiceNote src={src} duration={attachment.durationSeconds} mine={mine} />
    ) : (
      <Card icon={<Loader2 className="size-5 animate-spin" />} title={attachment.name} meta="Voice note" mine={mine} />
    );
  }

  if (attachment.type === MESSAGE_TYPES.IMAGE) {
    return (
      <>
        <button
          type="button"
          onClick={() => src && setLightbox(true)}
          className="group relative block max-w-[16rem] overflow-hidden rounded-lg bg-foreground/5"
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
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
          ) : (
            <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <DownloadButton src={src} name={attachment.name} dark />
            </span>
          )}
        </button>
        {src ? (
          <MediaLightbox open={lightbox} onClose={() => setLightbox(false)} src={src} name={attachment.name} kind="image" />
        ) : null}
      </>
    );
  }

  if (attachment.type === MESSAGE_TYPES.VIDEO) {
    return (
      <>
        <button type="button" onClick={() => src && setLightbox(true)} className="block w-full text-left">
          <Card
            icon={<Play className="size-5" />}
            title={attachment.name}
            meta={["Video", meta].filter(Boolean).join(" · ")}
            mine={mine}
            action={src ? <DownloadButton src={src} name={attachment.name} dark={mine} /> : null}
          />
        </button>
        {src ? (
          <MediaLightbox open={lightbox} onClose={() => setLightbox(false)} src={src} name={attachment.name} kind="video" />
        ) : null}
      </>
    );
  }

  return (
    <Card
      icon={<FileText className="size-5" />}
      title={attachment.name}
      meta={["File", meta].filter(Boolean).join(" · ")}
      mine={mine}
      action={src ? <DownloadButton src={src} name={attachment.name} dark={mine} /> : null}
    />
  );
}

/** The not-downloaded placeholder: an icon, the name and size, and a load
    control. Images get a tall tile; everything else gets the row card. */
function DownloadGate({
  attachment,
  mine,
  meta,
  onLoad,
}: {
  attachment: Att;
  mine: boolean;
  meta: string;
  onLoad: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const start = () => {
    setLoading(true);
    onLoad();
  };

  if (attachment.type === MESSAGE_TYPES.IMAGE) {
    return (
      <div className="relative grid h-44 w-60 place-items-center overflow-hidden rounded-lg bg-foreground/10">
        <ImageIcon className="absolute size-9 text-foreground/15" />
        <LoadButton loading={loading} onLoad={start} dark={false} />
        {meta ? <span className="absolute bottom-2 left-2 text-xs text-foreground/70">{meta}</span> : null}
      </div>
    );
  }

  const label =
    attachment.type === MESSAGE_TYPES.AUDIO ? "Voice note" : attachment.type === MESSAGE_TYPES.VIDEO ? "Video" : "File";
  const icon =
    attachment.type === MESSAGE_TYPES.AUDIO ? (
      <Mic className="size-5" />
    ) : attachment.type === MESSAGE_TYPES.VIDEO ? (
      <Play className="size-5" />
    ) : (
      <FileText className="size-5" />
    );

  return (
    <Card
      icon={icon}
      title={attachment.name}
      meta={[label, meta].filter(Boolean).join(" · ")}
      mine={mine}
      action={<LoadButton loading={loading} onLoad={start} dark={mine} />}
    />
  );
}
