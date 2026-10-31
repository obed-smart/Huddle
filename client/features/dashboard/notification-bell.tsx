"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Requests inbox trigger. The only notifications Huddle raises are a direct
 * ping or a group invite, so they live here, not per message. The list and
 * count are wired to the backend in a later pass.
 */
export function NotificationBell({ count = 0 }: { count?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label={count ? `Requests, ${count} new` : "Requests"}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell />
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
            <p className="px-1 pb-2 text-sm font-semibold">Requests</p>
            <p className="px-1 text-sm text-muted-foreground">
              Nothing waiting right now.
            </p>
            <p className="px-1 pt-1 text-xs text-muted-foreground">
              When someone pings you or invites you to a group, it shows up here.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
