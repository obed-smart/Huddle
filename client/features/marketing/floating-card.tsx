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

  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={
        reduce ? undefined : { opacity: 1, scale: 1, y: [0, -9, 0] }
      }
      transition={
        reduce
          ? undefined
          : {
              opacity: { duration: 0.5, delay },
              scale: { duration: 0.5, delay },
              y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay },
            }
      }
    >
      {children}
    </motion.div>
  );
}
