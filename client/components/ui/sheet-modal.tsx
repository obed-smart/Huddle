"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { springs } from "@/lib/springs";

type Props = {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Called after the close animation finishes (reset draft state here). */
  onExited?: () => void;
};

/**
 * A focused-task modal: a dimming scrim pushes the background back, the panel
 * rises and settles on a spring (a cross-fade when motion is reduced), centered
 * on desktop and a bottom sheet on phones. Portaled to the body so it is never
 * trapped by a translucent header's containing block. Escape and the scrim
 * close it; children own the header and body.
 */
export function SheetModal({ open, onClose, label, children, onExited }: Props) {
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

  const panel = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return createPortal(
    <AnimatePresence onExitComplete={onExited}>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={springs.snappy}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="relative flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-popover shadow-xl md:max-w-md md:rounded-2xl"
            variants={panel}
            transition={springs.sheet}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
