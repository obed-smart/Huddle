import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AppPreview } from "@/components/landing/app-preview";
import { routes } from "@/components/landing/content";

/** Top of the page: the one honest headline, two actions, and a calm preview. */
export function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
        <div className="flex flex-col items-start gap-6 text-center lg:text-left">
          <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground lg:mx-0">
            Chat · Call · Meet
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Talk to your people, all in one place.
          </h1>

          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Huddle keeps your messages, calls, and meetings together — so a
            quick question doesn&apos;t mean opening three different apps.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={routes.register}>Create account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href={routes.login}>Sign in</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            A demo client for the Huddle real-time backend.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}
