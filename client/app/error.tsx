"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/** Root error boundary. Logs the real error for us, shows a generic message to
    the user — never a stack trace or internal detail. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-secondary px-6 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error happened. Please try again.
        </p>
      </div>
      <Button size="lg" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
