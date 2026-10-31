"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { springs } from "@/lib/springs";
import { useIsDesktop } from "./use-is-desktop";
import { RequestList } from "./request-list";

type Props = { open: boolean; onClose: () => void };

/**
 * The requests inbox, adapted to the platform (a core design principle):
 * - desktop: a parallel, non-blocking popover that scales from the bell, no
 *   scrim so the flow is not broken, solid (the header is already translucent,
 *   and stacking translucency collapses legibility);
 * - phones: a full screen, which quick-touch devices call for over a cramped
 *   dropdown, pushed in from the side like any secondary screen.
 */
export function RequestsPanel({ open, onClose }: Props) {
  const isDesktop = useIsDesktop();
  return isDesktop ? (
    <DesktopPopover open={open} onClose={onClose} />
  ) : (
    <MobileScreen open={open} onClose={onClose} />
  );
}

function DesktopPopover({ open, onClose }: Props) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {open ? (
        <motion.div initial="hidden" animate="visible" exit="hidden">
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Requests"
            className="absolute right-0 top-full z-50 mt-2 w-[340px] origin-top-right overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
            variants={
              reduce
                ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
                : { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } }
            }
            transition={springs.snappy}
          >
            <header className="border-b px-4 py-2.5">
              <p className="text-sm font-semibold">Requests</p>
            </header>
            <div className="max-h-[70vh] overflow-y-auto p-2">
              <RequestList />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MobileScreen({ open, onClose }: Props) {
  const reduce = useReducedMotion();
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="dialog"
          aria-label="Requests"
          className="fixed inset-0 z-[60] flex flex-col bg-background"
          initial={{ opacity: 0, x: reduce ? 0 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: reduce ? 0 : 24 }}
          transition={springs.default}
        >
          <header
            className="flex items-center gap-2 border-b px-3 py-3"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
              <ArrowLeft />
            </Button>
            <p className="text-base font-semibold">Requests</p>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <RequestList />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
