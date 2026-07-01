import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  uniqueIndex,
  integer,
} from "drizzle-orm/pg-core";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { globalRoleEnum } from "./enums";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    password: text("password_hash"),
    googleId: text("googleId"),
    avatarUrl: text("avatar_url"),
    avatarColor: varchar("avatar_color", { length: 20 }),
    bio: varchar("bio", { length: 255 }),
    globalRole: globalRoleEnum("global_role").default("user").notNull(),
    isEmailVerified: boolean("is_email_verified").default(false).notNull(),
    emailVerificationToken: text("email_verification_token"),
    passwordResetOtp: text("password_reset_otp"),
    passwordResetOtpExpiry: timestamp("password_reset_expires_at", {
      withTimezone: true,
    }),
    passwordResetAttempts: integer("password_reset_attempts"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_username_idx").on(table.username),
    uniqueIndex("users_email_idx").on(table.email),
  ],
);

export type IUser = InferSelectModel<typeof usersTable>;
export type INewUser = InferInsertModel<typeof usersTable>;
