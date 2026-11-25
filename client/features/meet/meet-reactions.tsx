"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { useMeet } from "./meet-store";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "👏", "🔥", "🙌", "😮"];

/** The little palette that pops above the reactions button. */
export function ReactionBar({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-popover p-1.5 shadow-xl">
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          aria-label={`React ${e}`}
          className="grid size-9 place-items-center rounded-full text-xl transition-transform hover:scale-110 active:scale-95"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function offset(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return (h % 90) - 45;
}

/** The layer that floats each reaction up from the control bar and fades it out
    a little short of the top, then removes it. Sits above the stage, below the
    chrome. */
export function ReactionFloat() {
  const reactions = useMeet((s) => s.reactions);
  const drop = useMeet((s) => s.dropReaction);
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-20 flex justify-center">
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className="absolute text-4xl"
            initial={{ opacity: 0, y: 0, scale: 0.6, x: offset(r.id) }}
            animate={{ opacity: [0, 1, 1, 0], y: reduce ? -40 : -300, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.6 : 2.2, ease: "easeOut", times: [0, 0.1, 0.7, 1] }}
            onAnimationComplete={() => drop(r.id)}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
