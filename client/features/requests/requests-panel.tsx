"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { springs } from "@/lib/springs";
import { toast } from "@/lib/notify";
import { acceptPing, declinePing, respondInvite } from "@/lib/api/requests";
import { useRequests } from "@/stores/requests";
import { useConversations } from "@/stores/conversations";
import { RequestItem } from "./request-item";

type Props = { open: boolean; onClose: () => void };

/** The requests inbox: a parallel, non-blocking panel (translucent, no scrim)
    that scales from the bell it belongs to, holding pending pings and invites. */
export function RequestsPanel({ open, onClose }: Props) {
  const reduce = useReducedMotion();
  const pings = useRequests((s) => s.pings);
  const invites = useRequests((s) => s.invites);
  const status = useRequests((s) => s.status);
  const removePing = useRequests((s) => s.removePing);
  const removeInvite = useRequests((s) => s.removeInvite);
  const refresh = useConversations((s) => s.refresh);
  const total = pings.length + invites.length;

  const variants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, scale: 0.96 }, visible: { opacity: 1, scale: 1 } };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Requests"
            className="absolute right-0 top-full z-50 mt-2 w-[min(340px,calc(100vw-1.5rem))] origin-top-right overflow-hidden rounded-2xl border border-border bg-popover shadow-xl"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={springs.snappy}
          >
            <header className="flex items-center justify-between border-b px-4 py-2.5">
              <p className="text-sm font-semibold">Requests</p>
              {total > 0 ? <span className="text-xs text-muted-foreground">{total}</span> : null}
            </header>

            <div className="max-h-[70vh] overflow-y-auto p-2">
              {status === "loading" && total === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">Loading…</p>
              ) : total === 0 ? (
                <div className="px-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">Nothing waiting right now.</p>
                  <p className="pt-1 text-xs text-muted-foreground">
                    Pings and group invites show up here.
                  </p>
                </div>
              ) : (
                <>
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
                          Invite to join{" "}
                          <span className="font-semibold">{i.conversationName ?? "a group"}</span>
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
                </>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
