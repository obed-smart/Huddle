import { cookies } from "next/headers";

import type { AuthUser, Conversation } from "@/lib/contracts";

/**
 * Server-only reads for the first paint. Importing `next/headers` makes this
 * module impossible to pull into a client bundle, so the backend origin and the
 * session cookie never leave the server. We call `BACKEND_ORIGIN` directly (the
 * same host the rewrites proxy to) because a relative URL has no origin to
 * resolve against on the server.
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "";

async function serverGet<T>(path: string): Promise<T | null> {
  if (!BACKEND_ORIGIN) return null;
  const cookie = (await cookies()).toString();
  if (!cookie) return null;
  try {
    const res = await fetch(BACKEND_ORIGIN + path, {
      headers: { cookie, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as { data?: T } | null;
    if (!body) return null;
    return (body.data ?? (body as unknown as T)) ?? null;
  } catch {
    // A server read is best effort: on any failure the client takes over,
    // where it can refresh an expired token before deciding anything.
    return null;
  }
}

/** The signed-in user, or null when the server cannot resolve the session. */
export function getMe() {
  return serverGet<AuthUser>("/api/v1/user/me");
}

/** The user's conversations for the first paint (null on any failure). */
export function getConversations() {
  return serverGet<Conversation[]>("/api/v1/conversation");
}
