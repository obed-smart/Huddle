import Link from "next/link";

import { Button } from "@/components/ui/button";
import { routes } from "@/components/landing/content";

/** A calm closing invitation — soft tint, one primary action. */
export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 sm:pb-20">
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-accent px-6 py-12 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight text-accent-foreground sm:text-3xl">
          Ready to jump in?
        </h2>
        <p className="max-w-md text-sm text-accent-foreground/80 sm:text-base">
          Create an account and start a conversation in about a minute.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={routes.register}>Create account</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full border-transparent bg-card sm:w-auto"
          >
            <Link href={routes.login}>Sign in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
