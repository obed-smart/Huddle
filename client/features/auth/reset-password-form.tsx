"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TextField, PasswordField } from "./fields";
import { CooldownButton } from "./cooldown-button";
import { forgotPassword, resetPassword, ApiError } from "@/lib/api/auth";

const emailOk = (v: string) => /.+@.+\..+/.test(v.trim());

/** Reset a password: request a 6-digit code, then submit the email, the code,
    and the new password together (the route checks all three at once). */
export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function sendCode() {
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code.");
      throw err;
    }
  }

  const otpOk = /^\d{6}$/.test(otp);
  const matchOk = password === confirm && confirm.length > 0;
  const canReset = sent && emailOk(email) && otpOk && password.length >= 8 && matchOk && !submitting;

  async function onReset(event: FormEvent) {
    event.preventDefault();
    if (!canReset) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({ email: email.trim(), otp, password, passwordCompare: confirm });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset the password.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="font-display text-lg font-bold">Password reset</h2>
        <p className="text-sm text-muted-foreground">Sign in with your new password now.</p>
        <Link
          href="/login"
          className="mt-1 grid h-11 w-full place-items-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-sm"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onReset} className="flex flex-col gap-4" noValidate>
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      ) : null}

      <TextField
        id="reset-email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {sent ? (
        <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          We sent a 6-digit code to {email.trim()}. Check your inbox and spam.
        </p>
      ) : null}

      <CooldownButton action={sendCode} idleLabel="Send code" resentLabel="Resend code" disabled={!emailOk(email)} />

      {sent ? (
        <>
          <TextField
            id="reset-otp"
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <PasswordField
            id="reset-password"
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PasswordField
            id="reset-confirm"
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirm}
            error={confirm && !matchOk ? "Passwords do not match." : undefined}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <Button type="submit" size="lg" className="w-full" disabled={!canReset}>
            {submitting ? "Resetting…" : "Reset password"}
          </Button>
        </>
      ) : null}

      <Link href="/login" className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground">
        Back to sign in
      </Link>
    </form>
  );
}
