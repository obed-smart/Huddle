import { z } from "zod";
import { conversationVisibilityEnum } from "../../db/schema/enums";

export const conversationIdSchema = z.object({
  id: z.uuid("conversationId must be a valid uuid"),
});

export const conversationParamsSchema = z.object({
  conversationId: z.uuid("conversationId must be a valid uuid"),
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

export const joinRequestRespondSchema = z.object({
  decision: z.enum(["accept", "decline"]),
});

export const joinRequestResolveSchema = z.object({
  decision: z.enum(["approve", "decline"]),
});

export const groupRequestIdSchema = z.object({
  requestId: z.uuid("RequestId must be a valid uuid"),
});

export const inviteCodeSchema = z.object({
  inviteCode: z
    .string("a valid string is required")
    .length(10, "An inviteCode must be 10"),
});

export const inviteUserSchema = z.object({
  conversationId: z.uuid("conversationId must be a valid uuid"),
  userId: z.uuid("userId must be a valid uuid"),
});

export type IjoinRequestRespondSchema = z.infer<
  typeof joinRequestRespondSchema
>;

export const conversationUserSchemaParams = z.object({
  conversationId: z.uuid("conversationId must be a valid uuid"),
  userId: z.uuid("userId must be a valid uuid"),
});

export const updateAdminRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export const leaveConversationSchema = z.object({
  conversationId: z.uuid("conversationId must be a valid uuid"),
});

export const updateConversationSchema = z
  .object({
    name: z.string().min(1, { error: "Name is required" }).max(100),
    description: z.string().max(500),
    avatarUrl: z.url("Avatar URL must be a valid URL"),
    visibility: z.enum(conversationVisibilityEnum.enumValues),
  })
  .partial()
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "At least one field must be provided",
      });
    }
  });

  export type IupdateConversationSchema = z.infer<typeof updateConversationSchema>;

export type IjoinRequestResolveSchema = z.infer<
  typeof joinRequestResolveSchema
>;
