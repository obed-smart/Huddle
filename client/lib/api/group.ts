import { request } from "./http";
import type { GroupDetails, GroupMember, GroupRole, JoinRequest } from "@/lib/contracts";

export type { GroupDetails, GroupMember, GroupRole, JoinRequest };

export type CreateGroupInput = {
  name: string;
  description?: string;
  visibility: "private" | "public";
  participantIds: string[];
};

/**
 * Create a group. The server invites every participant (they receive it in
 * their requests inbox) and requires at least two, none of them the creator.
 */
export function createGroup(input: CreateGroupInput) {
  return request<{ id: string }>("/api/v1/conversation/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

const base = (id: string) => `/api/v1/conversation/${encodeURIComponent(id)}`;

export function fetchGroupDetails(id: string) {
  return request<GroupDetails>(base(id));
}

export function updateGroup(id: string, data: { name?: string; description?: string }) {
  return request<unknown>(base(id), { method: "PATCH", body: JSON.stringify(data) });
}

export function setMemberRole(id: string, userId: string, role: "admin" | "member") {
  return request<unknown>(`${base(id)}/participants/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function removeMember(id: string, userId: string) {
  return request<unknown>(`${base(id)}/participants/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}

export function leaveGroup(id: string) {
  return request<unknown>(`${base(id)}/participants/me`, { method: "DELETE" });
}

export function inviteMember(conversationId: string, userId: string) {
  return request<unknown>("/api/v1/conversation/invites", {
    method: "POST",
    body: JSON.stringify({ conversationId, userId }),
  });
}

/** Generate (or rotate) the group's invite code. Reads the code off whatever
    shape the server returns. */
export async function generateInviteCode(id: string): Promise<string | null> {
  const data = await request<Record<string, unknown>>(`${base(id)}/invite-code`, {
    method: "PATCH",
  });
  const code = data?.inviteCode ?? data?.invite_code ?? data?.code;
  return typeof code === "string" ? code : null;
}

export function fetchJoinRequests(id: string) {
  return request<{ result: number; requests: JoinRequest[] }>(`${base(id)}/requests`);
}

export function resolveJoinRequest(requestId: string, decision: "approve" | "decline") {
  return request<unknown>(
    `/api/v1/conversation/join-requests/${encodeURIComponent(requestId)}`,
    { method: "PATCH", body: JSON.stringify({ decision }) },
  );
}

/** What a `/join/<code>` link resolves to before you join. */
export type InvitePreview = {
  id: string;
  name: string | null;
  avatar?: string | null;
  description?: string | null;
  visibility?: "public" | "private" | null;
  membersCount?: number | null;
};

/** Look up the group an invite code points to (for the join screen). */
export function fetchInvite(code: string) {
  return request<InvitePreview>(`/api/v1/conversation/invites/${encodeURIComponent(code)}`);
}

/** Join (public) or request to join (private) via an invite code. A public
    group returns the membership; a private one returns a "request sent" string. */
export function joinByInvite(code: string) {
  return request<unknown>(`/api/v1/conversation/invites/${encodeURIComponent(code)}`, {
    method: "POST",
  });
}
