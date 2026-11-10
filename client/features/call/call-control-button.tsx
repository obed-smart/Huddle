"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Variant = "default" | "end" | "accept";

type Props = {
  icon: ReactNode;
  /** Shown under the button, and used as the accessible name. */
  label?: string;
  /** Accessible name when there is no visible label (icon-only toggles). */
  srLabel?: string;
  /** A toggle that is currently on (muted, speaker on): inverts the button. */
  active?: boolean;
  variant?: Variant;
  disabled?: boolean;
  onClick?: () => void;
};

/** One round call control. Translucent on the call backdrop by default, filled
    white when a toggle is on, and colored for the end and accept actions. The
    press feedback and transition follow the app's motion rules. */
export function CallControlButton({
  icon,
  label,
  srLabel,
  active = false,
  variant = "default",
  disabled = false,
  onClick,
}: Props) {
  const base =
    "grid place-items-center rounded-full outline-none transition-[transform,background-color,color] duration-150 ease-out active:scale-95 focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-40";

  const look =
    variant === "end"
      ? "size-16 bg-destructive text-destructive-foreground hover:bg-destructive/90 [&_svg]:size-7"
      : variant === "accept"
        ? "size-16 bg-success text-white hover:bg-success/90 [&_svg]:size-7"
        : active
          ? "size-14 bg-white text-[#2c2a63] [&_svg]:size-6"
          : "size-14 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25 [&_svg]:size-6";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label ?? srLabel}
        aria-pressed={active || undefined}
        className={cn(base, look)}
      >
        {icon}
      </button>
      {label ? <span className="text-xs font-medium text-white/80">{label}</span> : null}
    </div>
  );
}
