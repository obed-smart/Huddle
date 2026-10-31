"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import { ApiError } from "@/lib/api/http";
import { pingUser, type SearchedUser } from "@/lib/api/users";

/** One search result: the person, and a Ping that starts a DM request. */
export function UserResult({ user }: { user: SearchedUser }) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const name = user.displayName || user.username;

  async function ping() {
    if (state !== "idle") return;
    setState("sending");
    try {
      await pingUser(user.id);
      setState("sent");
      toast(`Ping sent to @${user.username}.`);
    } catch (err) {
      setState("idle");
      toast(err instanceof ApiError ? err.message : "Could not send the ping.");
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-secondary">
      <Avatar src={user.avatarUrl} name={name} className="size-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          @{user.username}
          {user.bio ? ` · ${user.bio}` : ""}
        </p>
      </div>
      <Button
        variant={state === "sent" ? "soft" : "secondary"}
        size="sm"
        disabled={state !== "idle"}
        onClick={ping}
      >
        {state === "sending" ? (
          <Loader2 className="animate-spin" />
        ) : state === "sent" ? (
          <>
            <Check /> Pinged
          </>
        ) : (
          "Ping"
        )}
      </Button>
    </div>
  );
}
