import type { Feature } from "@/features/marketing/content";

/** One quiet feature: soft icon tile, title, a line of plain description. */
export function FeatureCard({ feature }: { feature: Feature }) {
  const { icon: Icon, title, description } = feature;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
