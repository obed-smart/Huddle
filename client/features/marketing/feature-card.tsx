import type { Feature } from "@/features/marketing/content";
import { Reveal } from "@/features/marketing/reveal";

/** One feature: a soft icon tile that fills with brand on hover, a title, and a
    line of plain description. Lifts a touch on hover for a sense of depth. */
export function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const { icon: Icon, title, description } = feature;

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <div className="group flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
        <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" />
        </span>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </Reveal>
  );
}
