"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MailCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { TextField } from "./fields";
import { resendVerification, ApiError } from "@/lib/api/auth";

/** How long the resend button stays on cooldown. The determinate fill is meant
    to be watched, so this is a short, conventional window. */
const COOLDOWN_SECONDS = 60;

const looksLikeEmail = (value: string) => /.+@.+\..+/.test(value.trim());

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/** Shown when login succeeds on password but the email is unverified. Lets the
    user resend the verification link, with a cooldown button whose fill is a
    determinate progress indicator (linear, as the design system prescribes for
    time-based motion). */
export function VerifyEmailNotice({ email: initialEmail, onBack }: { email: string; onBack: () => void }) {
  const reduce = useReducedMotion();
  const [email, setEmail] = useState(initialEmail);
  const [sending, setSending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const cooling = secondsLeft > 0;
  const canSend = looksLikeEmail(email) && !sending && !cooling;

  async function onSend(event: FormEvent) {
    event.preventDefault();
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await resendVerification(email.trim());
      setSentTo(email.trim());
      setAttempt((a) => a + 1);
      setSecondsLeft(COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the email. Try again.");
    } finally {
      setSending(false);
    }
  }

  const label = sending
    ? "Sending…"
    : cooling
      ? `Resend in ${clock(secondsLeft)}`
      : sentTo
        ? "Resend verification email"
        : "Send verification email";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="size-6" />
        </span>
        <h2 className="font-display text-lg font-bold">Verify your email</h2>
        <p className="text-sm text-muted-foreground">
          Your email isn’t verified yet. We’ll send a verification link so you can finish signing in.
        </p>
      </div>

      {sentTo ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          Link sent to {sentTo}. Check your inbox and spam.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <form onSubmit={onSend} className="flex flex-col gap-4" noValidate>
        <TextField
          id="verify-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          type="submit"
          disabled={!canSend}
          aria-live="polite"
          className={cn(
            "relative h-12 w-full overflow-hidden rounded-md bg-primary text-base font-medium text-primary-foreground shadow-sm transition-transform active:scale-[0.99]",
            !canSend && !cooling && "opacity-60",
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
              transition={{ duration: COOLDOWN_SECONDS, ease: "linear" }}
            />
          ) : null}
          <span className="relative">{label}</span>
        </button>
      </form>

      <button
        type="button"
        onClick={onBack}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Back to sign in
      </button>
    </div>
  );
}
