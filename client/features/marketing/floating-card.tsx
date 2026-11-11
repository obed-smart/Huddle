"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** A product card that drifts gently beside the hero preview, for depth. The
    float is slow and small (Apple keeps ambient motion quiet), and it holds
    still for anyone who prefers reduced motion. */
export function FloatingCard({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();

  // `initial` is rendered into the server HTML, so it must not depend on
  // useReducedMotion (false on the server, true on a reduced-motion client),
  // or hydration mismatches. Keep it constant; branch only the client-side
  // animate and transition, which run after hydration. Reduced motion keeps the
  // gentle fade and drops the endless float.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1, y: reduce ? 0 : [0, -9, 0] }}
      transition={{
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay },
        ...(reduce
          ? {}
          : { y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay } }),
      }}
    >
      {children}
    </motion.div>
  );
}
