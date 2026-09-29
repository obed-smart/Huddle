ALTER TABLE "call_participants"
ADD COLUMN "session_id" uuid NOT NULL;

--> statement-breakpoint
ALTER TABLE "call_participants"
ADD COLUMN "left_at" timestamp
with
    time zone;

--> statement-breakpoint
ALTER TABLE "calls"
ADD COLUMN "initiator_session_id" uuid NOT NULL;

--> statement-breakpoint
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions" ("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_initiator_session_id_sessions_id_fk" FOREIGN KEY ("initiator_session_id") REFERENCES "public"."sessions" ("id") ON DELETE restrict ON UPDATE no action;

--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_leg_per_session" ON "call_participants" USING btree ("session_id")
WHERE
    "call_participants"."left_at" IS NULL;

--> statement-breakpoint
CREATE UNIQUE INDEX "calls_one_active_per_owner_session" ON "calls" USING btree ("initiator_session_id")
WHERE
    "calls"."end_at" IS NULL;