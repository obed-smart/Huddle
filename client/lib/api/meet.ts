import { request } from "./http";

/** A meeting room, as the backend returns it. Keyed by meetId (the id in the
    /meet/[id] route). */
export type Meet = {
  meetId: string;
  title?: string | null;
  conversationId: string;
};

/** Create a meeting for a conversation and get its room back, ready to open at
    /meet/[meetId]. */
export function createMeet(conversationId: string, title?: string) {
  return request<Meet>("/api/v1/meet", {
    method: "POST",
    body: JSON.stringify({ conversationId, title }),
  });
}

/** The meetings currently live for the user (to show or join from a list). */
export function fetchActiveMeets() {
  return request<Meet[]>("/api/v1/meet/active");
}
