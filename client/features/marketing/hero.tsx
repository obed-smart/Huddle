import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroShowcase } from "@/features/marketing/hero-showcase";
import { Reveal } from "@/features/marketing/reveal";
import { routes } from "@/features/marketing/content";

/** A small cluster of overlapping avatars, decorative, no invented numbers. */
function AvatarRow() {
  const tints = ["bg-primary/90", "bg-primary/70", "bg-accent-foreground/80", "bg-primary/50"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2.5">
        {tints.map((tint, i) => (
          <span
            key={i}
            className={`size-8 rounded-full border-2 border-background ${tint}`}
          />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Open it and start a conversation in about a minute.
      </p>
    </div>
  );
}

/** Top of the page: the headline, two actions, and the layered app preview. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 right-[-12%] h-[540px] w-[540px] rounded-full bg-primary/20 blur-[130px]"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
        <Reveal className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-accent-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Chat, call, and meet in one place
          </span>

          <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
            Talk to your people, all in one place.
          </h1>

          <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
            Huddle keeps your messages, calls, and meetings together, so a quick
            question never means opening three different apps.
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full px-6 sm:w-auto">
              <Link href={routes.register}>
                Start chatting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-full px-6 sm:w-auto"
            >
              <Link href={routes.login}>Sign in</Link>
            </Button>
          </div>

          <AvatarRow />
        </Reveal>

        <Reveal delay={0.1} className="flex justify-center lg:justify-end">
          <HeroShowcase />
        </Reveal>
      </div>
    </section>
  );
}
