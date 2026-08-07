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

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(1, "Username cannot be empty")
      .max(20)
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    displayName: z.string().trim().max(50),
    bio: z.string().trim().max(255),
    avatarUrl: z.url("Invalid URL format"),
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

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
