"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

type Props = {
  /** Resolves on success (starts the cooldown); rejects to skip it. */
  action: () => Promise<void>;
  idleLabel: string;
  resentLabel?: string;
  prefix?: string;
  cooldownSeconds?: number;
  disabled?: boolean;
};

/** A primary button that, after a successful action, goes on a timed cooldown
    with a countdown and a determinate progress fill (linear, as the design
    system prescribes for time-based motion; static under reduced motion). */
export function CooldownButton({
  action,
  idleLabel,
  resentLabel,
  prefix = "Resend in",
  cooldownSeconds = 60,
  disabled,
}: Props) {
  const reduce = useReducedMotion();
  const [pending, setPending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [fired, setFired] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const cooling = secondsLeft > 0;
  const blocked = pending || cooling || Boolean(disabled);

  async function onClick() {
    if (blocked) return;
    setPending(true);
    try {
      await action();
      setFired(true);
      setAttempt((a) => a + 1);
      setSecondsLeft(cooldownSeconds);
    } catch {
      // The caller surfaces its own error; no cooldown on failure.
    } finally {
      setPending(false);
    }
  }

  const label = pending
    ? "Sending…"
    : cooling
      ? `${prefix} ${clock(secondsLeft)}`
      : fired && resentLabel
        ? resentLabel
        : idleLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={blocked}
      aria-live="polite"
      className={cn(
        "relative h-12 w-full overflow-hidden rounded-md bg-primary text-base font-medium text-primary-foreground shadow-sm transition-transform active:scale-[0.99]",
        disabled && !cooling && "opacity-60",
        cooling && "cursor-not-allowed select-none",
      )}
    >
      {cooling && !reduce ? (
        <motion.span
          key={attempt}
          aria-hidden
          className="absolute inset-0 origin-left bg-primary-foreground/20"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: cooldownSeconds, ease: "linear" }}
        />
      ) : null}
      <span className="relative">{label}</span>
    </button>
  );
}
