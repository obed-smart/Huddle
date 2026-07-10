import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .transform((val) => val.trim().toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long"),

  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),

  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
});

export const loginSchema = z.object({
  identifier: z.string({
    error: (issue) => issue.input === undefined
      ? "Email or username is required"
      : "Email or username must be a string",
  }).trim().min(1, "Email or username is required"),

  password: z.string({
    error: (issue) => issue.input === undefined
      ? "Password is required"
      : "Password must be a string",
  }).min(1, "Password is required"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
