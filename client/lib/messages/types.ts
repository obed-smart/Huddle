/** Message shapes live in the contracts module; re-exported here for the
    message layer. NormalizeContext is client-internal (not a backend shape). */
export { MESSAGE_TYPES } from "@/lib/contracts";
export type { MessageType, Attachment, MessageSender, Reaction, Message } from "@/lib/contracts";

export type NormalizeContext = {
  conversationId?: string | null;
  source?: string;
  pending?: boolean;
  localOnly?: boolean;
  mine?: boolean | null;
};
