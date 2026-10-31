import { request } from "./http";
import { paths } from "./config";

export type SearchedUser = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

/** The server only accepts a username of letters, numbers and underscores (max
    20), so the query is sanitised to that before it is sent. */
export function sanitizeUsername(value: string): string {
  return value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

/** Find people by username (excludes the signed-in user; server-limited). */
export function searchUsers(username: string) {
  return request<SearchedUser[]>(`${paths.userSearch}?username=${encodeURIComponent(username)}`);
}

/** Ping a user to start a direct conversation (a DM request). */
export function pingUser(userId: string) {
  return request<unknown>("/api/v1/conversation/ping", {
    method: "POST",
    body: JSON.stringify({ id: userId }),
  });
}
