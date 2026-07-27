import { z } from "zod";
import { conversationVisibilityEnum } from "../../db/schema/enums";

export const conversationIdSchema = z.object({
  id: z.uuid("conversationId must be a valid uuid"),
});

export const conversationIdEventSchema = z.object({
  conversationId: z.uuid({
    error: (issue) =>
      issue.input === undefined
        ? "conversationId is required"
        : "conversationId must be a valid uuid",
  }),
});

export const createGroupConversationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Group name must be at least 3 characters.")
    .max(100, "Group name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .optional(),

  visibility: z.enum(conversationVisibilityEnum.enumValues),

  participantIds: z
    .array(z.uuid())
    .min(2, "A group requires at least two participants."),
});


const respondToInviteSchema = z.object({
  action: z.enum(["accept", "decline"]),
});
