import { request } from "./http";
import { paths } from "./config";
import type { Conversation } from "./types";

/** Every conversation the signed-in user is part of. */
export function fetchConversations() {
  return request<Conversation[]>(paths.conversations);
}
