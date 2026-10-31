import { request } from "./http";

/** A pending group invite from GET /user/me/pending-invites. `id` is the
    request id used to respond; `fromUser` is the inviter's user id. */
export type GroupInvite = {
  id: string;
  conversationId: string;
  conversationName: string | null;
  conversationAvatar: string | null;
  fromUser: string | null;
  createdAt?: string | null;
};

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
