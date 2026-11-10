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
    <div className="flex items-center gap-3 pt-2">
      <div className="flex -space-x-2.5">
        {tints.map((tint, i) => (
          <span key={i} className={`size-8 rounded-full ring-2 ring-background ${tint}`} />
        ))}
      </div>
      <p className="text-sm text-muted-foreground">Open it and start a conversation in about a minute.</p>
    </div>
  );
}

/** Top of the page: the headline, two actions, and the layered app preview. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 right-[-10%] size-[620px] rounded-full bg-primary/15 blur-[150px]" />
        <div className="absolute left-[-12%] top-44 size-[380px] rounded-full bg-primary/10 blur-[130px]" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_1fr]">
        <Reveal className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            Chat, call, and meet in one place
          </span>

          <h1 className="font-display text-[2.7rem] font-bold leading-[0.98] tracking-[-0.03em] text-balance sm:text-6xl lg:text-[4rem]">
            Talk to your people,
            <span className="text-primary"> all in one place.</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Huddle keeps your messages, calls, and meetings together, so a quick question never means
            opening three different apps.
          </p>

          <div className="flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="w-full rounded-full px-6 shadow-sm shadow-primary/25 sm:w-auto">
              <Link href={routes.register}>
                Start chatting
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full rounded-full px-6 sm:w-auto">
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
