import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { usersTable } from "./schema.user";

export const sessionsTable = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),

    // userAgent: text("user_agent"),
    // ip: text("ip_first"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [index("sessions_user_idx").on(t.userId, t.revokedAt)],
);

export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessionsTable.id, { onDelete: "cascade" }),

    tokenHash: text("token_hash").notNull(),

    usedAt: timestamp("used_at", { withTimezone: true }),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("refresh_tokens_session_idx").on(t.sessionId),
    index("refresh_token_hash_idx").on(t.tokenHash),
  ],
);

export type IRefreshToken = InferSelectModel<typeof refreshTokensTable>;
export type INewRefreshToken = InferInsertModel<typeof refreshTokensTable>;
