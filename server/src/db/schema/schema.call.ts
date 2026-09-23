import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { conversationsTable } from "./schema.conversations";
import { usersTable } from "./schema.user";
import { text } from "drizzle-orm/pg-core";
import { callOutCome, calltype } from "./type";
import { timestamp } from "drizzle-orm/pg-core";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";
import { check } from "drizzle-orm/pg-core";
import { primaryKey } from "drizzle-orm/pg-core";

export const callTable = pgTable(
  "calls",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    initiatorId: uuid("initiator_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    type: text("type").$type<calltype>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    connectedAt: timestamp("connected_at", { withTimezone: true }),
    endedAt: timestamp("end_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("calls_one_active_per_conversation")
      .on(t.conversationId)
      .where(sql`${t.endedAt} IS NULL`),

    // Call history for one conversation, newest first.
    index("calls_conversation_started_idx").on(
      t.conversationId,
      t.startedAt.desc(),
    ),

    check("calls_type_check", sql`${t.type} IN ('audio', 'video')`),

    check(
      "calls_ended_after_started",
      sql`${t.endedAt} IS NULL OR ${t.endedAt} >= ${t.startedAt}`,
    ),
  ],
);

export const callParticipant = pgTable(
  "call_participants",
  {
    callId: uuid("call_id")
      .notNull()
      .references(() => callTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    outcome: text("outcome").$type<callOutCome>().notNull().default("pending"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    callStartedAt: timestamp("call_started_at", { withTimezone: true }),
  },
  (t) => [
    primaryKey({ columns: [t.callId, t.userId] }),

    // "My call log, newest first."
    // The primary key can't serve this: user_id is its second column,
    // and a composite index only helps when you filter on the first one.
    index("call_participants_user_log_idx").on(
      t.userId,
      t.callStartedAt.desc(),
      t.callId.desc(),
    ),

    check(
      "call_participants_outcome_check",
      sql`${t.outcome} IN ('pending', 'joined', 'declined', 'missed')`,
    ),
  ],
);

export type ICall = typeof callTable.$inferSelect;
export type INewCall = typeof callTable.$inferInsert;

export type ICallParticipant = typeof callParticipant.$inferSelect;

export type INewCallParticipant = typeof callParticipant.$inferInsert;
