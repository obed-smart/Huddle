"use client";

import { toast } from "@/lib/notify";
import { acceptPing, declinePing, respondInvite } from "@/lib/api/requests";
import { useRequests } from "@/stores/requests";
import { useConversations } from "@/stores/conversations";
import { RequestItem } from "./request-item";

/** The pending pings and invites, shared by the desktop popover and the
    full-screen mobile view. Accepting refreshes the conversation list. */
export function RequestList() {
  const pings = useRequests((s) => s.pings);
  const invites = useRequests((s) => s.invites);
  const status = useRequests((s) => s.status);
  const removePing = useRequests((s) => s.removePing);
  const removeInvite = useRequests((s) => s.removeInvite);
  const refresh = useConversations((s) => s.refresh);
  const total = pings.length + invites.length;

  if (status === "loading" && total === 0) {
    return <p className="px-2 py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (total === 0) {
    return (
      <div className="px-2 py-10 text-center">
        <p className="text-sm text-muted-foreground">Nothing waiting right now.</p>
        <p className="pt-1 text-xs text-muted-foreground">Pings and group invites show up here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {pings.map((p) => (
        <RequestItem
          key={`ping-${p.conversationId}`}
          avatarName={p.requester.username}
          avatarSrc={p.requester.avatarUrl}
          title={
            <>
              <span className="font-semibold">@{p.requester.username}</span> pinged you
            </>
          }
          subtitle="Wants to start a chat"
          onAccept={async () => {
            await acceptPing(p.conversationId);
            await refresh();
            toast(`Chat with @${p.requester.username} started.`);
          }}
          onDecline={() => declinePing(p.conversationId).then(() => undefined)}
          onDone={() => removePing(p.conversationId)}
        />
      ))}

      {invites.map((i) => (
        <RequestItem
          key={`invite-${i.id}`}
          avatarName={i.conversationName ?? "Group"}
          avatarSrc={i.conversationAvatar}
          title={
            <>
              Invite to join <span className="font-semibold">{i.conversationName ?? "a group"}</span>
            </>
          }
          subtitle="Group invitation"
          onAccept={async () => {
            await respondInvite(i.id, "accept");
            await refresh();
            toast(`You joined ${i.conversationName ?? "the group"}.`);
          }}
          onDecline={() => respondInvite(i.id, "decline").then(() => undefined)}
          onDone={() => removeInvite(i.id)}
        />
      ))}
    </div>
  );
}
