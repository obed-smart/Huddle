"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Download } from "lucide-react";

import { springs } from "@/lib/springs";
import { downloadFile } from "@/lib/media/download";

type Props = {
  open: boolean;
  onClose: () => void;
  src: string;
  name: string;
  kind: "image" | "video";
};

/** A full-screen in-app viewer for an image or a video. The scrim and the close
    button dismiss it; the download button saves the file. Nothing opens a tab. */
export function MediaLightbox({ open, onClose, src, name, kind }: Props) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={springs.snappy}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

          <div className="absolute right-4 top-4 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => downloadFile(src, name)}
              aria-label="Download"
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Download className="size-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <motion.div
            className="relative"
            initial={reduce ? false : { scale: 0.96 }}
            animate={{ scale: 1 }}
            exit={reduce ? undefined : { scale: 0.96 }}
            transition={springs.default}
          >
            {kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={name}
                className="max-h-[88vh] max-w-[92vw] rounded-lg object-contain"
              />
            ) : (
              <video
                src={src}
                controls
                autoPlay
                className="max-h-[88vh] max-w-[92vw] rounded-lg"
              />
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
