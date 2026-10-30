import type { Transition } from "motion/react";

/**
 * Spring presets — Apple's damping/response translated to motion's bounce/duration.
 * Default is critically damped (no overshoot); bounce is reserved for motion
 * that follows a real gesture (a flick, a drag release).
 */
export const springs = {
  /** Default UI spring — graceful, no bounce. */
  default: { type: "spring", bounce: 0, duration: 0.4 },
  /** Snappier default for small, frequent changes. */
  snappy: { type: "spring", bounce: 0, duration: 0.28 },
  /** Drawer / sheet. */
  sheet: { type: "spring", bounce: 0, duration: 0.34 },
  /** Momentum — a little overshoot, only after a gesture carried velocity. */
  momentum: { type: "spring", bounce: 0.22, duration: 0.4 },
} satisfies Record<string, Transition>;
