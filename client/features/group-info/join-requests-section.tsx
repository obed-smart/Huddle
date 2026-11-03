"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { fetchJoinRequests, resolveJoinRequest, type JoinRequest } from "@/lib/api/group";

/** Pending requests to join the group, with approve/decline (admins only). */
export function JoinRequestsSection({ groupId, onApproved }: { groupId: string; onApproved: () => void }) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchJoinRequests(groupId)
      .then((d) => {
        if (!cancelled) setRequests(Array.isArray(d?.requests) ? d.requests : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  async function resolve(req: JoinRequest, decision: "approve" | "decline") {
    if (busy) return;
    setBusy(req.id);
    try {
      await resolveJoinRequest(req.id, decision);
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      if (decision === "approve") onApproved();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Could not update the request.");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) return null;

  return (
    <section className="px-2 py-2">
      <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Join requests
      </h3>
      {requests.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-2 py-2">
          <Avatar src={r.avatarUrl} name={r.username} className="size-9" />
          <p className="min-w-0 flex-1 truncate text-sm">
            <span className="font-medium">@{r.username}</span> asked to join
          </p>
          <Button size="icon-sm" aria-label="Approve" disabled={busy === r.id} onClick={() => resolve(r, "approve")}>
            <Check />
          </Button>
          <Button
            size="icon-sm"
            variant="secondary"
            aria-label="Decline"
            disabled={busy === r.id}
            onClick={() => resolve(r, "decline")}
          >
            <X />
          </Button>
        </div>
      ))}
    </section>
  );
}
