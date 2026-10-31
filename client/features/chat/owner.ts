import type { AuthUser } from "@/lib/api/types";
import type { Message, MessageSender } from "@/lib/messages/types";

/**
 * Is this message the signed-in user's? History identifies the sender by id,
 * socket payloads by username, and a just-typed message by neither until the
 * server answers, so both fields are checked.
 */
export function isMine(message: Message, user: AuthUser | null): boolean {
  if (message.mine != null) return message.mine;
  if (!user) return false;
  const s = message.sender;
  if (s.id && user.id) return s.id === user.id;
  if (s.username && user.username) return s.username === user.username;
  return false;
}

/** The sender block for an optimistic message, from the current user. */
export function senderFromUser(user: AuthUser | null): MessageSender {
  return {
    id: user?.id ?? null,
    username: user?.username ?? null,
    displayName: user?.displayName ?? null,
    avatar: user?.avatarUrl ?? null,
  };
}
