import { z } from "zod";


const MAX_ATTACHMENTS = 10;


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

const attachmentInputSchema = z.object({
  objectKey: z.string().min(1),
  kind: z.enum(["voice", "image", "video", "file"]),
  fileName: z.string().min(1).max(255),
  mime: z.string().min(1),
  duration: z.number().int().nonnegative().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const sendMessageSchema = z
  .object({
    tempId: z.uuid("invalid tempId"),
    conversationId: z.uuid("invalid conversationId"),
    content: z.string().trim().min(1, "Message content is required").optional(),
    replyToMessageId: z.uuid("invalid replyMessageId").optional(),
    mentions: z.array(mentionSchema).max(50).optional(),
    attachments: z.array(attachmentInputSchema).min(1).max(MAX_ATTACHMENTS).optional(),
  })
  .refine((d) => Boolean(d.content) || Boolean(d.attachments?.length), {
    message: "A message must have text or an attachment",
    path: ["content"],
  })
  .superRefine((d, ctx) => {
    const list = d.attachments ?? [];
    if (new Set(list.map((a) => a.objectKey)).size !== list.length) {
      ctx.addIssue({ code: "custom", message: "Duplicate attachment", path: ["attachments"] });
    }
    if (new Set(list.map((a) => a.kind)).size > 1) {
      ctx.addIssue({ code: "custom", message: "All attachments must be the same kind", path: ["attachments"] });
    }
    if (list[0]?.kind === "voice" && list.length > 1) {
      ctx.addIssue({ code: "custom", message: "A voice note must be a single file", path: ["attachments"] });
    }
  });

export const conversationIdSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
});

export const typeSchema = conversationIdSchema.extend({
  action: z.enum(["typing", "recording"]),
});

export const messageReadSchema = z.object({
  conversationId: z.uuid("invalid conversationId"),
  lastMessageId: z.uuid("invalid messageId"),
});

export type CreateMessagePayload = z.infer<typeof createMessageSchema>;
