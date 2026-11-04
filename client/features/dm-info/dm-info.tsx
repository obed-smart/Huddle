"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Ban } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { springs } from "@/lib/springs";
import { toast } from "@/lib/notify";
import type { Conversation } from "@/lib/api/types";

type Props = { conversation: Conversation; open: boolean; onClose: () => void };

/** The direct chat's info, opened from the chat header. The other person's
    photo, their name, and a (not yet built) block action. A one-on-one chat has
    no invite link. Tapping the photo pops it out full size. */
export function DmInfo({ conversation, open, onClose }: Props) {
  const reduce = useReducedMotion();
  const [zoom, setZoom] = useState(false);

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 flex justify-end" initial="hidden" animate="visible" exit="hidden">
            <motion.div
              className="absolute inset-0 hidden bg-foreground/30 backdrop-blur-sm md:block"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
              transition={springs.snappy}
              onClick={onClose}
            />
            <motion.div
              role="dialog"
              aria-label="Contact info"
              className="relative flex h-full w-full flex-col bg-background md:max-w-[420px] md:border-l"
              initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
              transition={springs.sheet}
            >
              <header className="glass flex items-center gap-2 border-b px-3 py-3">
                <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
                  <X />
                </Button>
                <p className="text-base font-semibold">Contact info</p>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col items-center gap-2 px-4 pb-6 pt-8 text-center">
                  <button
                    type="button"
                    onClick={() => setZoom(true)}
                    aria-label="View profile photo"
                    className="rounded-full transition-transform active:scale-95"
                  >
                    <Avatar src={conversation.avatar} name={conversation.name} className="size-28 text-3xl" />
                  </button>
                  <h2 className="font-display text-xl font-bold">{conversation.name}</h2>
                  <p className="text-sm text-muted-foreground">Direct message</p>
                </div>

                <div className="border-t px-2 py-2">
                  <button
                    type="button"
                    onClick={() => toast("Blocking is coming soon.")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-destructive transition-colors hover:bg-secondary/60"
                  >
                    <Ban className="size-5" />
                    <span className="text-sm font-medium">Block {conversation.name}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {zoom ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springs.snappy}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setZoom(false)} />
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Close photo"
              className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
            <motion.div initial={reduce ? false : { scale: 0.9 }} animate={{ scale: 1 }} transition={springs.default}>
              {conversation.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="max-h-[80vh] max-w-[80vw] rounded-2xl object-contain"
                />
              ) : (
                <Avatar src={null} name={conversation.name} className="size-64 text-6xl" />
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>,
    document.body,
  );
}
