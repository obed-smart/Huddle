import { request } from "./http";

export type GroupRole = "super_admin" | "admin" | "member";

export type GroupMember = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: GroupRole;
};

/**
 * Everything the group-info screen needs, in one fetch. Needs a backend route:
 *   GET /api/v1/conversation/:id  (member-only)
 * returning these fields (participants mirror the public-user shape + role).
 */
export type GroupDetails = {
  id: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  visibility?: "private" | "public";
  membersCount: number;
  inviteCode?: string | null;
  myRole: GroupRole;
  participants: GroupMember[];
};

export type JoinRequest = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
};

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
