import { z } from "zod";

export const createMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  content: z.string().min(1, "Message content cannot be empty"),
});

export type CreateMessagePayload = z.infer<typeof createMessageSchema>;
