import { Reveal } from "@/features/marketing/reveal";
import { assurances } from "@/features/marketing/content";

/** A quiet band of honest reassurances, in place of invented logos or numbers. */
export function TrustStrip() {
  return (
    <section className="border-y border-border bg-secondary/40">
      <Reveal className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-x-10 gap-y-3 px-4 py-6 sm:flex-row sm:px-6">
        {assurances.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className="size-4 text-primary" />
            {label}
          </span>
        ))}
      </Reveal>
    </section>
  );
}
