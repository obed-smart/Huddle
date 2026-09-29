DROP INDEX "one_active_leg_per_session";--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_leg_per_session" ON "call_participants" USING btree ("session_id") WHERE "call_participants"."session_id" IS NOT NULL
      AND "call_participants"."left_at" IS NULL
      AND "call_participants"."outcome" = 'joined';