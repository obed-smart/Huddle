import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** A calm entrance for a landing section: fade and lift on load, via CSS so the
    content is never hidden behind JS. An optional delay staggers siblings. The
    reduced-motion rule in globals.css collapses it to an instant reveal. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const style = delay ? ({ animationDelay: `${delay}s` } as CSSProperties) : undefined;
  return (
    <div className={cn("reveal", className)} style={style}>
      {children}
    </div>
  );
}
