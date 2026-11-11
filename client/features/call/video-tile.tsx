"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Props = {
  stream: MediaStream | null;
  /** Mute the element (always true for your own self view, to avoid echo). */
  muted?: boolean;
  /** Flip horizontally, like a mirror, for your own camera. */
  mirror?: boolean;
  className?: string;
};

/** A video element bound to a MediaStream through a ref (srcObject cannot be a
    React prop). Covers its box; a call is user initiated so autoplay is fine. */
export function VideoTile({ stream, muted = false, mirror = false, className }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.srcObject !== stream) el.srcObject = stream;
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn("size-full object-cover", mirror && "-scale-x-100", className)}
    />
  );
}
