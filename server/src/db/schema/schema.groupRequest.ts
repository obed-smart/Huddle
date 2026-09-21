import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { conversationsTable } from "./schema.conversations";
import { usersTable } from "./schema.user";
import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import { uniqueIndex } from "drizzle-orm/pg-core";

export const groupJoinRequestsTable = pgTable(
  "group_join_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    invitedBy: uuid("invited_by").references(() => usersTable.id, {
      onDelete: "set null",
    }), // nullable — null = self joined via link
    status: text("status", { enum: ["pending", "approved", "declined"] })
      .notNull()
      .default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }), // when approved/declined, nullable until then
  },
  (t) => [
    uniqueIndex("group_join_requests_user_conversation_idx")
      .on(t.conversationId, t.userId)
      .where(sql`${t.status} = 'pending'`),
    index("group_join_requests_conversation_idx").on(
      t.conversationId,
      t.status,
    ),
  ],
);
export type IGroupRequest = InferSelectModel<typeof groupJoinRequestsTable>;
export type INewGroupRequest = InferInsertModel<typeof groupJoinRequestsTable>;
