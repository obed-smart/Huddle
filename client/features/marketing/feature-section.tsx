import type { ReactNode } from "react";
import { Mic, Video, PhoneOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/features/marketing/reveal";
import { features, type Feature } from "@/features/marketing/content";

/** One bento tile. Sizes vary by placement, so the grid has rhythm instead of
    three identical cards. */
function Tile({ feature, className, children }: { feature: Feature; className?: string; children?: ReactNode }) {
  const { icon: Icon, title, description } = feature;
  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.4rem] border border-border/70 bg-card p-6 transition-[transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35",
        className,
      )}
    >
      <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors duration-200 ease-out group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function MiniChat() {
  return (
    <div className="mt-6 flex flex-col gap-2">
      <span className="w-fit rounded-2xl rounded-bl-md bg-secondary px-3 py-1.5 text-xs">Did the designs land?</span>
      <span className="w-fit self-end rounded-2xl rounded-br-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
        Just sent them, plus a voice note.
      </span>
    </div>
  );
}

function MiniCall() {
  return (
    <div className="mt-auto flex items-center gap-3 pt-8">
      <span className="grid size-9 place-items-center rounded-full bg-secondary">
        <Mic className="size-4" />
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-secondary">
        <Video className="size-4" />
      </span>
      <span className="grid size-9 place-items-center rounded-full bg-destructive text-destructive-foreground">
        <PhoneOff className="size-4" />
      </span>
    </div>
  );
}

/** The "what's inside" bento: one wide messaging tile, a tall calling tile, a
    wide groups tile. Asymmetric on purpose, one column on phones. */
export function FeatureSection() {
  const [messages, calls, groups] = features;
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <Reveal className="flex max-w-xl flex-col gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Features</span>
        <h2 className="font-display text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
          Everything a conversation needs
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          The basics done well. Message, call, and meet without leaving the same window.
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-12 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
        <Tile feature={messages} className="lg:col-span-2">
          <MiniChat />
        </Tile>
        <Tile feature={calls} className="lg:col-start-3 lg:row-span-2">
          <MiniCall />
        </Tile>
        <Tile feature={groups} className="lg:col-span-2" />
      </Reveal>
    </section>
  );
}
