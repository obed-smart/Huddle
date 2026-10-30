"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type AvatarProps = {
  src?: string | null;
  name: string;
  className?: string;
};

/** Round avatar: the photo when it loads, initials on a soft tint otherwise. */
export function Avatar({ src, name, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-accent-foreground",
        className,
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-sm font-semibold">{initials(name)}</span>
      )}
    </span>
  );
}
