"use client";

import { useState, type KeyboardEvent } from "react";
import { FileText } from "lucide-react";

import type { Attachment as Att } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";
import { MediaLightbox } from "./media-lightbox";
import { Card, DownloadButton, LoadButton, formatSize, isPdf } from "./attachment-ui";

/** A file card. A PDF can be opened in the in-app viewer by tapping the card
    (it loads first if needed); every file has a download control. */
export function FileAttachment({ attachment, mine }: { attachment: Att; mine: boolean }) {
  const ready = mine || attachment.localOnly;
  const [loaded, setLoaded] = useState(ready);
  const { src } = useAttachmentUrl(attachment, loaded);
  const [viewer, setViewer] = useState(false);
  const [wantView, setWantView] = useState(false);
  const pdf = isPdf(attachment.mimeType, attachment.name);
  const meta = [pdf ? "PDF" : "File", formatSize(attachment.size)].filter(Boolean).join(" · ");

  // Tapping a PDF loads it (when needed); the viewer opens once the url is ready
  // (derived, so there is no setState inside an effect).
  const showing = viewer || (wantView && Boolean(src));

  function open() {
    if (src) setViewer(true);
    else {
      setLoaded(true);
      setWantView(true);
    }
  }

  function close() {
    setViewer(false);
    setWantView(false);
  }

  const action = src ? (
    <DownloadButton src={src} name={attachment.name} dark={mine} />
  ) : (
    <LoadButton loading={false} onLoad={() => setLoaded(true)} dark={mine} />
  );

  const card = (
    <Card icon={<FileText className="size-5" />} title={attachment.name} meta={meta} mine={mine} action={action} />
  );

  if (!pdf) return card;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
          }
        }}
        className="block w-fit cursor-pointer text-left"
      >
        {card}
      </div>
      {src ? (
        <MediaLightbox open={showing} onClose={close} src={src} name={attachment.name} kind="pdf" />
      ) : null}
    </>
  );
}
