import { request } from "./http";
import type { GroupInvite } from "@/lib/contracts";

export type { GroupInvite };

export function fetchPendingInvites() {
  return request<{ result: number; invites: GroupInvite[] }>(
    "/api/v1/user/me/pending-invites",
  );
}

/** Accept/decline a direct ping. The id is the (pending) conversation's id. */
export function acceptPing(conversationId: string) {
  return request<unknown>(
    `/api/v1/conversation/pings/${encodeURIComponent(conversationId)}/accept`,
    { method: "POST" },
  );
}

export function declinePing(conversationId: string) {
  return request<unknown>(
    `/api/v1/conversation/pings/${encodeURIComponent(conversationId)}/decline`,
    { method: "POST" },
  );
}

/** Respond to a group invite by its request id. */
export function respondInvite(requestId: string, decision: "accept" | "decline") {
  return request<unknown>(
    `/api/v1/conversation/invites/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify({ decision }) },
  );
}
