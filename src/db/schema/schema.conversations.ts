import { timestamp } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";
import { usersTable } from "./schema.user";
import { text } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import {
  conversationRoleEnum,
  conversationTypeEnum,
  conversationVisibilityEnum,
  pingStatusEnum,
} from "./enums";
import {
  AnyPgColumn,
  uniqueIndex,
  index,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";

import { messagesTable } from "./schema.messages";

export const conversationsTable = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: conversationTypeEnum("type").notNull(),
    visibility: conversationVisibilityEnum("visibility").notNull(),

    // DM dedup key: sorted `userA:userB`. Unique constraint is what makes
    // "does this DM already exist" a single indexed lookup / insert-conflict
    // instead of an application-level race.
    directKey: text("direct_key"),

    // group-only — must stay NULL for `direct` (enforced app-side; see note below)
    name: text("name"),
    description: text("description"),
    avatarUrl: text("avatar_url"),

    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id),

    // Ping gating — DMs only. Null for groups and for DMs between already-friends users.
    pingStatus: pingStatusEnum("ping_status"),
    requestedBy: uuid("requested_by").references(() => usersTable.id),

    // Denormalized for O(1)-sort inbox queries — updated in the same
    // transaction as every message insert. lastMessageId nullable because a
    // conversation can exist with zero messages.
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessageId: uuid("last_message_id").references(
      (): AnyPgColumn => messagesTable.id,
      { onDelete: "set null" },
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("conversations_direct_key_unique").on(t.directKey),

    index("conversations_last_message_at_idx").on(t.lastMessageAt),

    check(
      "direct_conversations_are_private",
      sql`${t.type} != 'direct' OR ${t.visibility} = 'private'`,
    ),
  ],
);

export type IConversation = InferSelectModel<typeof conversationsTable>;
export type INewConversation = InferInsertModel<typeof conversationsTable>;

// ---- conversation_participants ----------------------------------------
// Source of truth for "what conversations does this user have" — the
// conversation list is a query against this table joined to conversations,
// not a separately maintained list.

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: conversationRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReadMessageId: uuid("last_read_message_id").references(
      (): AnyPgColumn => messagesTable.id,
    ),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    isMuted: boolean("is_muted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.conversationId, t.userId] }),
    index("conversation_participants_user_idx").on(t.userId),
  ],
);

export type IConversationParticipant = InferSelectModel<
  typeof conversationParticipants
>;
export type INewConversationParticipant = InferInsertModel<
  typeof conversationParticipants
>;
