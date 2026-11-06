"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, Ban } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { springs } from "@/lib/springs";
import { toast } from "@/lib/notify";
import type { Conversation } from "@/lib/api/types";
import { usePeople } from "@/stores/people";
import { fetchUserByUsername } from "@/lib/api/users";
import { InfoShell } from "@/features/chat/info-shell";
import { CallActions } from "@/features/chat/call-actions";

type Props = { conversation: Conversation; onClose: () => void };

/** The direct chat's info: the other person's photo (tap to pop out), their
    name and bio, voice/video/meet, and a (not yet built) block action. Shown as
    a third column on a large screen, full screen on a phone. No invite link. */
export function DmInfo({ conversation, onClose }: Props) {
  const reduce = useReducedMotion();
  const [zoom, setZoom] = useState(false);
  const otherId = conversation.otherUserId ?? null;
  const person = usePeople((s) => (otherId ? s.byId[otherId] : undefined));
  const merge = usePeople((s) => s.merge);

  // Best effort: when we know this person's username but not their bio, fetch it.
  useEffect(() => {
    const username = person?.username;
    if (!username || person?.bio !== undefined) return;
    let cancelled = false;
    fetchUserByUsername(username)
      .then((u) => {
        if (!cancelled && u) merge([{ id: u.id, username: u.username, bio: u.bio ?? null }]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [person?.username, person?.bio, merge]);

  return (
    <>
      <InfoShell title="Contact info" onClose={onClose}>
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
          {person?.bio ? (
            <p className="mt-1 max-w-xs whitespace-pre-wrap text-sm text-foreground/80">{person.bio}</p>
          ) : null}
        </div>

        <CallActions />

        <div className="px-2 py-2">
          <button
            type="button"
            onClick={() => toast("Blocking is coming soon.")}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-destructive transition-colors hover:bg-secondary/60"
          >
            <Ban className="size-5" />
            <span className="text-sm font-medium">Block {conversation.name}</span>
          </button>
        </div>
      </InfoShell>

      {typeof document !== "undefined"
        ? createPortal(
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
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
