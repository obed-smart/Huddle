import { FeatureCard } from "@/features/marketing/feature-card";
import { Reveal } from "@/features/marketing/reveal";
import { features } from "@/features/marketing/content";

/** The "what's inside" grid: one column on phones, three on desktop. */
export function FeatureSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28"
    >
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Features
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Everything a conversation needs
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
          The basics done well. Message, call, and meet without leaving the same
          window.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} feature={feature} index={index} />
        ))}
      </div>
    </section>
  );
}
