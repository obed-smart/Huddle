"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";

import { TextField } from "./fields";
import { CooldownButton } from "./cooldown-button";
import { resendVerification, ApiError } from "@/lib/api/auth";

const looksLikeEmail = (value: string) => /.+@.+\..+/.test(value.trim());

/** Shown when login succeeds on password but the email is unverified. Lets the
    user resend the verification link, with a cooldown on the button. */
export function VerifyEmailNotice({ email: initialEmail, onBack }: { email: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setError(null);
    try {
      await resendVerification(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the email. Try again.");
      throw err;
    }
  }

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

      <TextField
        id="verify-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <CooldownButton
        action={send}
        idleLabel="Send verification email"
        resentLabel="Resend verification email"
        disabled={!looksLikeEmail(email)}
      />

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
