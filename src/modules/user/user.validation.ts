import { z } from "zod";

export const searchUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Search query cannot be empty")
    .max(20)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});


