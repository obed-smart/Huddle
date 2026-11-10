"use client";

import { Avatar } from "@/components/ui/avatar";

type Props = {
  name: string;
  src?: string | null;
  /** Ripple the aura while the call is ringing or connecting. */
  pulsing?: boolean;
};

/** The large call portrait with a soft ring. While ringing, two concentric
    auras ripple outward behind it; once connected they stop and it rests. */
export function CallAvatar({ name, src, pulsing = false }: Props) {
  return (
    <div className="relative grid size-44 place-items-center">
      {pulsing ? (
        <>
          <span className="call-aura absolute size-40 rounded-full bg-white/20" />
          <span
            className="call-aura absolute size-40 rounded-full bg-white/20"
            style={{ animationDelay: "1.2s" }}
          />
        </>
      ) : null}
      <Avatar
        src={src}
        name={name}
        className="relative size-32 text-4xl font-semibold shadow-2xl ring-4 ring-white/20"
      />
    </div>
  );
}
