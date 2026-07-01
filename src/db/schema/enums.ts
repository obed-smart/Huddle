import { pgEnum } from "drizzle-orm/pg-core";

export const globalRoleEnum = pgEnum("global_role", ["user", "admin"]);

export const conversationTypeEnum = pgEnum("conversation_type", [
  "direct",
  "group",
]);

export const conversationVisibilityEnum = pgEnum("conversation_visibility", [
  "private",
  "public",
]);

export const conversationRoleEnum = pgEnum("conversation_role", [
  "owner",
  "admin",
  "member",
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "video",
  "audio",
  "voice",
  "file",
  "system",
]);

export const friendshipStatusEnum = pgEnum("friendship_status", [
  "pending",
  "accepted",
  "rejected",
  "blocked",
]);
