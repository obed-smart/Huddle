import { Phone, PhoneOff } from "lucide-react";

import { AppPreview } from "@/features/marketing/app-preview";
import { FloatingCard } from "@/features/marketing/floating-card";

/** The chat preview, with two translucent product cards drifting beside it for
    depth: an incoming call and a live typing note. Parallel panels, offset and
    frosted over the page, never stacked on each other. */
export function HeroShowcase() {
  return (
    <div className="relative w-full max-w-md">
      <AppPreview />

      <FloatingCard
        delay={0.25}
        className="glass absolute -top-7 right-[-14%] hidden w-60 rounded-2xl border p-3 shadow-xl sm:block"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            AL
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Ada Lovelace</p>
            <p className="text-xs text-muted-foreground">Incoming call</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <span className="grid size-9 place-items-center rounded-full bg-destructive text-destructive-foreground">
            <PhoneOff className="size-4" />
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
            <Phone className="size-4" />
          </span>
        </div>
      </FloatingCard>

      <FloatingCard
        delay={0.55}
        className="glass absolute -bottom-4 left-[-8%] hidden items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 shadow-xl sm:flex"
      >
        <span className="grid size-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
          DH
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground" />
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
        </span>
        <span className="text-xs text-muted-foreground">typing</span>
      </FloatingCard>
    </div>
  );
}
