import { FeatureCard } from "@/components/landing/feature-card";
import { features } from "@/components/landing/content";

/** The short "what's inside" grid: one column on phones, up to four on desktop. */
export function FeatureSection() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
    >
      <div className="flex flex-col gap-3 text-center">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Everything a conversation needs
        </h2>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          The basics done well — message, call, and meet without leaving the
          same window.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </div>
    </section>
  );
}
