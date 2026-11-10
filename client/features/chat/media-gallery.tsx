"use client";

import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { springs } from "@/lib/springs";
import { downloadFile } from "@/lib/media/download";
import type { Attachment } from "@/lib/messages/types";
import { useAttachmentUrl } from "./use-attachment-url";

type Props = { items: Attachment[]; start: number; open: boolean; onClose: () => void };

const chip =
  "grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20";
const arrow =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20";

/** A full-screen image viewer. With more than one image it is a gallery: arrows
    and the arrow keys on a large screen, swipe on a phone, and a swipe past
    either end closes it (back to the chat). A stale signed url refreshes itself. */
export function MediaGallery({ items, start, open, onClose }: Props) {
  const [index, setIndex] = useState(start);
  const [wasOpen, setWasOpen] = useState(open);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // Reset to the opened image each time it opens (adjust state during render,
  // the documented pattern, so there is no setState inside an effect).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIndex(start);
  }

  const count = items.length;
  const safe = Math.min(Math.max(index, 0), count - 1);
  const current = items[safe];

  const go = useCallback(
    (dir: number) => {
      const next = safe + dir;
      if (next < 0 || next >= count) onClose();
      else setIndex(next);
    },
    [safe, count, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  function onStart(e: TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  }
  function onEnd(e: TouchEvent) {
    const s = touch.current;
    touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    else if (dy > 90) onClose();
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && current ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.snappy}
          onTouchStart={onStart}
          onTouchEnd={onEnd}
        >
          <div className="absolute inset-0 bg-black/90" onClick={onClose} />

          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <GalleryDownload attachment={current} />
            <button type="button" onClick={onClose} aria-label="Close" className={chip}>
              <X className="size-5" />
            </button>
          </div>

          {count > 1 ? (
            <>
              <button type="button" onClick={() => go(-1)} aria-label="Previous" className={cn(arrow, "left-3")}>
                <ChevronLeft className="size-6" />
              </button>
              <button type="button" onClick={() => go(1)} aria-label="Next" className={cn(arrow, "right-3")}>
                <ChevronRight className="size-6" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                {safe + 1} / {count}
              </span>
            </>
          ) : null}

          <GalleryImage key={current.id} attachment={current} />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

/** The current image, resolving (and refreshing on error) its own signed url. */
function GalleryImage({ attachment }: { attachment: Attachment }) {
  const { src, onError } = useAttachmentUrl(attachment, true);

  return (
    <motion.div
      className="relative"
      initial={{ scale: 0.97 }}
      animate={{ scale: 1 }}
      transition={springs.default}
      onClick={(e) => e.stopPropagation()}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={attachment.name}
          onError={onError}
          className="max-h-[86vh] max-w-[92vw] rounded-lg object-contain"
        />
      ) : (
        <Loader2 className="size-7 animate-spin text-white/70" />
      )}
    </motion.div>
  );
}

function GalleryDownload({ attachment }: { attachment: Attachment }) {
  const { src } = useAttachmentUrl(attachment, true);
  if (!src) return null;
  return (
    <button
      type="button"
      onClick={() => downloadFile(src, attachment.name)}
      aria-label="Save"
      className={chip}
    >
      <Download className="size-5" />
    </button>
  );
}
