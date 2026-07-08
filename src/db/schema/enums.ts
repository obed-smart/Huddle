import { pgEnum } from "drizzle-orm/pg-core";

export const globalRoleEnum = pgEnum("global_role", ["user", "admin"]);

export const authProviderEnum = pgEnum("auth_provider", [
  "local",
  "google",
]);


// status state machine to know the connnection statuse of the user
export const presenceStatusEnum = pgEnum("presence_status", [
  "online",
  "away",
  "busy",
  "offline",
]);

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

// the type of message sent
export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "video",
  "audio",
  "voice",
  "file",
  "system",
]);

// this is like a friend request state machine
export const pingStatusEnum = pgEnum("ping_status", [
  "pending",
  "accepted",
  "declined",
  "blocked",
]);
