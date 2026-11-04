"use client";

import { useState } from "react";
import { FileText, Download, Play, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { MESSAGE_TYPES, type Attachment as Att } from "@/lib/messages/types";
import { downloadFile } from "@/lib/media/download";
import { useAttachmentUrl } from "./use-attachment-url";
import { VoiceNote } from "./voice-note";
import { MediaLightbox } from "./media-lightbox";

function formatSize(bytes: number): string {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

/** A small round download control, kept from triggering the parent. */
function DownloadButton({ src, name, dark }: { src: string; name: string; dark: boolean }) {
  return (
    <button
      type="button"
      aria-label={`Download ${name}`}
      onClick={(e) => {
        e.stopPropagation();
        downloadFile(src, name);
      }}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
        dark
          ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
          : "bg-foreground/5 text-foreground hover:bg-foreground/10",
      )}
    >
      <Download className="size-4" />
    </button>
  );
}

/** The shared horizontal card for video and file attachments. */
function Card({
  icon,
  title,
  meta,
  mine,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  mine: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex w-60 items-center gap-3">
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-lg",
          mine ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {meta ? <p className="truncate text-xs opacity-75">{meta}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** One attachment inside a bubble: images and video open an in-app viewer,
    voice notes play inline, and files offer a download. Nothing opens a tab. */
export function ChatAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const { src, onError } = useAttachmentUrl(attachment);
  const [lightbox, setLightbox] = useState(false);
  const meta = formatSize(attachment.size);

  if (attachment.type === MESSAGE_TYPES.AUDIO) {
    return src ? (
      <VoiceNote src={src} duration={attachment.durationSeconds} mine={mine} />
    ) : (
      <Card icon={<Play className="size-5" />} title={attachment.name} meta="Voice note" mine={mine} />
    );
  }

  if (attachment.type === MESSAGE_TYPES.IMAGE) {
    return (
      <>
        <button
          type="button"
          onClick={() => src && setLightbox(true)}
          className="group relative block max-w-[16rem] overflow-hidden rounded-xl bg-foreground/5"
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={attachment.name} onError={onError} className="max-h-64 w-full object-cover" />
          ) : (
            <div className="grid h-40 w-64 place-items-center text-muted-foreground">
              <ImageIcon className="size-7" />
            </div>
          )}
          {src ? (
            <span className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
              <DownloadButton src={src} name={attachment.name} dark />
            </span>
          ) : null}
        </button>
        {src ? (
          <MediaLightbox
            open={lightbox}
            onClose={() => setLightbox(false)}
            src={src}
            name={attachment.name}
            kind="image"
          />
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
          <MediaLightbox
            open={lightbox}
            onClose={() => setLightbox(false)}
            src={src}
            name={attachment.name}
            kind="video"
          />
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
