"use client";

import { useEffect } from "react";

import { getSocket } from "@/lib/socket";
import { toast } from "@/lib/notify";
import { useRequests } from "@/stores/requests";
import { useConversations } from "@/stores/conversations";

type PingPayload = {
  conversationId?: string;
  requester?: { id: string; username: string; avatarUrl?: string | null };
};

/**
 * App-level request notifications: pending group invites are loaded once, and
 * the socket keeps the inbox live — a new ping or invite, or someone accepting
 * a ping you sent. Mounted once from the dashboard so the bell stays current
 * whether or not the panel is open.
 */
export function useRequestRealtime() {
  const addPing = useRequests((s) => s.addPing);
  const loadInvites = useRequests((s) => s.loadInvites);
  const refresh = useConversations((s) => s.refresh);

  useEffect(() => {
    loadInvites();
    const socket = getSocket();
    if (!socket) return;

    const onPingNew = (p: PingPayload) => {
      if (p?.conversationId && p.requester) {
        addPing({ conversationId: p.conversationId, requester: p.requester });
      }
    };
    const onInviteNew = () => loadInvites();
    const onPingAccepted = (p: PingPayload) => {
      toast(`@${p?.requester?.username ?? "Someone"} accepted your ping.`);
      refresh();
    };

    socket.on("ping:new", onPingNew);
    socket.on("invite:new", onInviteNew);
    socket.on("ping:accepted", onPingAccepted);
    return () => {
      socket.off("ping:new", onPingNew);
      socket.off("invite:new", onInviteNew);
      socket.off("ping:accepted", onPingAccepted);
    };
  }, [addPing, loadInvites, refresh]);
}
