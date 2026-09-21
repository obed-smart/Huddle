import { z } from "zod";

export const createMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
});

export const reactionsAddSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
  messageId: z.uuid("invalid messageId"),
  emoji: z.emoji("Invalid emoji").min(1).max(4, "Only one emoji allowed"),
});

export const reactionRemoveSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
  messageId: z.uuid("invalid messageId"),
});

export const mentionSchema = z.object({
  userId: z.uuid("invalid userId"),
});

export const sendMessageSchema = z.object({
  tempId: z.uuid("invalid tempId"),
  conversationId: z.uuid("invalid conversationId"),
  content: z.string().trim().min(1, "Message content is required"),
  replyToMessageId: z.uuid("invalid replyMessageId").optional(),
  mentions: z.array(mentionSchema).max(50).optional(),
});

export const conversationIdSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
});

export const messageReadSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
  lastMessageId: z.uuid("invalid messageId"),
});

export type CreateMessagePayload = z.infer<typeof createMessageSchema>;
