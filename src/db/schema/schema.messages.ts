import {
  AnyPgColumn,
  uuid,
  timestamp,
  text,
  index,
  pgTable,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

import { messageTypeEnum } from "./enums";
import { usersTable } from "./schema.user";
import { conversationsTable } from "./schema.conversations";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),

    senderId: uuid("sender_id")
      .notNull()
      .references(() => usersTable.id),

    type: messageTypeEnum("type").notNull().default("text"),
    // Nullable for media-only messages. Mentions encoded as @[uuid:displayName] —
    // uuid is authoritative for routing, name is a send-time snapshot.
    body: text("body"),
    replyToMessageId: uuid("reply_to_message_id").references(
      (): AnyPgColumn => messagesTable.id,
    ),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }), // soft delete only, never hard delete
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Reserved, not implemented: clientMessageId (text, unique-per-sender) for
    // offline/outbox idempotent sends. Flagged here so the future migration
    // isn't a surprise — see spec doc.
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

export type IMessage = InferSelectModel<typeof messagesTable>;
export type INewMessage = InferInsertModel<typeof messagesTable>;

export const attachmentsTable = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    messageId: uuid("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(), // bytes
    width: integer("width"), // images/video
    height: integer("height"), // images/video
    duration: integer("duration"), // audio/video, seconds
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("attachments_message_idx").on(t.messageId)],
);

// ---- message_reactions ---------------------------------------------------
// Composite PK is the uniqueness constraint — a separate id column would add
// nothing. Hard delete only (no soft-delete/history requirement).

export const messageReactionsTable = pgTable(
  "message_reactions",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    emoji: text("emoji").notNull(), // raw unicode character, not a name/code
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.messageId, t.userId, t.emoji] }),
    index("message_reactions_message_idx").on(t.messageId),
  ],
);

// ---- message_mentions ------------------------------------------------
// Populated at message-insert time by parsing @[uuid:displayName] markers —
// never derived from body at query time. conversationId is denormalized so
// "unread mentions in conversation Y" is a direct indexed scan, not a join
// through messages -> conversations.

export const messageMentionsTable = pgTable(
  "message_mentions",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => messagesTable.id, { onDelete: "cascade" }),
    mentionedUserId: uuid("mentioned_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.messageId, t.mentionedUserId] }),
    index("message_mentions_conversation_user_idx").on(
      t.conversationId,
      t.mentionedUserId,
    ),
  ],
);
