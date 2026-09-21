import { jsonb, uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { conversationsTable } from "./schema.conversations";
import { text } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./schema.user";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const systemEventsTable = pgTable("system_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversationsTable.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => usersTable.id), 
  type: text("type").notNull(), // 'name_changed' | 'member_added' | 'member_removed' | 'description_changed' | 'role_changed' | 'group_created'

  metadata: jsonb("metadata").notNull(), // event-specific payload, shape depends on `type`
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type IsystemEvent = InferSelectModel<typeof systemEventsTable>;
export type INewSystemEvent = InferInsertModel<typeof systemEventsTable>;
