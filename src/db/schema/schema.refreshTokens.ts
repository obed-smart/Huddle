import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import {
  relations,
  type InferSelectModel,
  type InferInsertModel,
} from "drizzle-orm";
import { usersTable } from "./schema.user";

export const refreshTokensTable = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_token_hash_idx").on(table.tokenHash),
  ],
);

export const refreshTokensRelations = relations(
  refreshTokensTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [refreshTokensTable.userId],
      references: [usersTable.id],
    }),
  }),
);

export type IRefreshToken = InferSelectModel<typeof refreshTokensTable>;
export type INewRefreshToken = InferInsertModel<typeof refreshTokensTable>;
