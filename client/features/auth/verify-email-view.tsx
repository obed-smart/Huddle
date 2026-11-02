"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, Loader2, TriangleAlert } from "lucide-react";

import { verifyEmail } from "@/lib/api/auth";

/** Completes verification from the emailed link's token. */
export function VerifyEmailView({ token }: { token: string }) {
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    token ? "verifying" : "error",
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "verifying") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center text-muted-foreground">
        <Loader2 className="size-7 animate-spin" />
        <p className="text-sm">Verifying your email…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <CircleCheck className="size-6" />
        </span>
        <h2 className="font-display text-lg font-bold">Email verified</h2>
        <p className="text-sm text-muted-foreground">Your email is confirmed. You can sign in now.</p>
        <Link
          href="/login"
          className="mt-1 grid h-11 w-full place-items-center rounded-md bg-primary text-sm font-medium text-primary-foreground shadow-sm transition-transform active:scale-[0.99]"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert className="size-6" />
      </span>
      <h2 className="font-display text-lg font-bold">Link invalid or expired</h2>
      <p className="text-sm text-muted-foreground">
        This verification link didn’t work. Sign in to send yourself a fresh one.
      </p>
      <Link href="/login" className="mt-1 text-sm font-medium text-accent-foreground hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
