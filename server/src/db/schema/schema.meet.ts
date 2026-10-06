import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { conversationsTable } from "./schema.conversations";
import { usersTable } from "./schema.user";
import { text } from "drizzle-orm/pg-core";
import { timestamp } from "drizzle-orm/pg-core";
import { uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";
import { sessionsTable } from "./schema.session";
import { primaryKey } from "drizzle-orm/pg-core";

export const meetTable = pgTable(
  "meets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    title: text("title"),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    createdAt: timestamp("create_at", { withTimezone: true }).defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("meets_one_active_instant_per_conversation")
      .on(t.conversationId)
      .where(sql`${t.scheduledFor} IS NULL AND ${t.endedAt} IS NULL`),

    index("meets_schedule_idx")
      .on(t.scheduledFor)
      .where(sql`${t.notifiedAt} IS NULL AND ${t.endedAt} IS NULL`),
  ],
);

export const meetParticipantTable = pgTable(
  "meet_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    meetId: uuid("meet_id")
      .notNull()
      .references(() => meetTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => sessionsTable.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (t) => [
    // one LIVE leg per device (unlimited closed rows; at most one open) — catches double-join
    uniqueIndex("meet_one_active_leg_per_session")
      .on(t.sessionId)
      .where(sql`${t.leftAt} IS NULL`),

    // attendance/duration query: all of a user's visits to a meet
    index("meet_participants_meet_user_idx").on(t.meetId, t.userId),
    // "who's live in this meet right now"
    index("meet_participants_active_idx")
      .on(t.meetId)
      .where(sql`${t.leftAt} IS NULL`),
  ],
);

// ── meet_invitees: the EXPECTATION list. makes "missed" computable ──
export const meetInviteeTable = pgTable(
  "meet_invitees",
  {
    meetId: uuid("meet_id")
      .notNull()
      .references(() => meetTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    invitedAt: timestamp("invited_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.meetId, t.userId, t.acceptedAt] })],
);

export type IMeet = typeof meetTable.$inferSelect;
export type INewMeet = typeof meetTable.$inferInsert;
