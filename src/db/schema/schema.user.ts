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
import { authProviderEnum, globalRoleEnum } from "./enums";

export const usersTable = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    password: text("password_hash"),
    provider: authProviderEnum("provider").default("local").notNull(),
    googleId: text("google_id"),
    avatarUrl: text("avatar_url"),
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
  (t) => [
    uniqueIndex("users_username_unique").on(t.username),
    uniqueIndex("users_email_unique").on(t.email),
    uniqueIndex("users_google_id_unique").on(t.googleId),
  ],
);

export type IUser = InferSelectModel<typeof usersTable>;
export type INewUser = InferInsertModel<typeof usersTable>;
