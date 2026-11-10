import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/features/marketing/reveal";
import { routes } from "@/features/marketing/content";

/** The closing invitation: one bold brand band, one clear action. */
export function CtaSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12 sm:py-20">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-primary-foreground/15 blur-3xl"
          />
          <div className="relative flex flex-col items-center gap-5">
            <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-[2.6rem]">
              Ready to jump in?
            </h2>
            <p className="max-w-md text-sm text-primary-foreground/80 sm:text-base">
              Create an account and start a conversation in about a minute.
            </p>
            <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full rounded-full bg-background px-6 text-foreground hover:bg-background/90 sm:w-auto"
              >
                <Link href={routes.register}>Create account</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full rounded-full border-primary-foreground/40 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                <Link href={routes.login}>Sign in</Link>
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
