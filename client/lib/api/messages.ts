import { request } from "./http";
import { normalizeMessage } from "@/lib/messages/normalize";
import type { Message } from "@/lib/messages/types";

/**
 * A conversation's transcript. The endpoint returns a TIMELINE (each row is
 * `{ type, data }`), newest first, so every row goes through normalizeMessage
 * and the list is reversed to read top to bottom.
 */
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const rows = await request<unknown[]>(
    `/api/v1/conversation/${encodeURIComponent(conversationId)}/messages`,
  );
  const list = Array.isArray(rows) ? rows : [];
  return list
    .slice()
    .reverse()
    .map((row) => normalizeMessage(row, { conversationId, source: "history" }))
    .filter((m): m is Message => Boolean(m));
}
