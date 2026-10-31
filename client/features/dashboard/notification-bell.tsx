"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequests } from "@/stores/requests";
import { RequestsPanel } from "@/features/requests/requests-panel";

/**
 * Requests inbox trigger. The only notifications Huddle raises are a direct
 * ping or a group invite, so they live here, not per message.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const count = useRequests((s) => s.pings.length + s.invites.length);

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

      <RequestsPanel open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
