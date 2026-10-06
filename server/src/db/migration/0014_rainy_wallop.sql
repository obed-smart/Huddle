CREATE TABLE "meet_invitees" (
	"meet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "meet_invitees_meet_id_user_id_pk" PRIMARY KEY("meet_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "meet_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meet_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "meets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"title" text,
	"scheduled_for" timestamp with time zone,
	"notified_at" timestamp with time zone,
	"create_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "meet_invitees" ADD CONSTRAINT "meet_invitees_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_invitees" ADD CONSTRAINT "meet_invitees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_participants" ADD CONSTRAINT "meet_participants_meet_id_meets_id_fk" FOREIGN KEY ("meet_id") REFERENCES "public"."meets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_participants" ADD CONSTRAINT "meet_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meet_participants" ADD CONSTRAINT "meet_participants_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meets" ADD CONSTRAINT "meets_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "meet_one_active_leg_per_session" ON "meet_participants" USING btree ("session_id") WHERE "meet_participants"."left_at" IS NULL;--> statement-breakpoint
CREATE INDEX "meet_participants_meet_user_idx" ON "meet_participants" USING btree ("meet_id","user_id");--> statement-breakpoint
CREATE INDEX "meet_participants_active_idx" ON "meet_participants" USING btree ("meet_id") WHERE "meet_participants"."left_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "meets_one_active_per_conversation" ON "meets" USING btree ("conversation_id") WHERE "meets"."ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "meets_schedule_idx" ON "meets" USING btree ("scheduled_for") WHERE "meets"."notified_at" IS NULL AND "meets"."ended_at" IS NULL;