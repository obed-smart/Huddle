CREATE TYPE "public"."call_status" AS ENUM('active', 'ended');--> statement-breakpoint
CREATE TABLE "call_participants" (
	"call_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"outcome" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp with time zone,
	"call_started_at" timestamp with time zone,
	CONSTRAINT "call_participants_call_id_user_id_pk" PRIMARY KEY("call_id","user_id"),
	CONSTRAINT "call_participants_outcome_check" CHECK ("call_participants"."outcome" IN ('pending', 'joined', 'declined', 'missed'))
);
--> statement-breakpoint
CREATE TABLE "calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"initiator_id" uuid NOT NULL,
	"type" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"connected_at" timestamp with time zone,
	"end_at" timestamp with time zone,
	CONSTRAINT "calls_type_check" CHECK ("calls"."type" IN ('audio', 'video')),
	CONSTRAINT "calls_ended_after_started" CHECK ("calls"."end_at" IS NULL OR "calls"."end_at" >= "calls"."started_at")
);
--> statement-breakpoint
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_call_id_calls_id_fk" FOREIGN KEY ("call_id") REFERENCES "public"."calls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "call_participants" ADD CONSTRAINT "call_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calls" ADD CONSTRAINT "calls_initiator_id_users_id_fk" FOREIGN KEY ("initiator_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "call_participants_user_log_idx" ON "call_participants" USING btree ("user_id","call_started_at" DESC NULLS LAST,"call_id" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "calls_one_active_per_conversation" ON "calls" USING btree ("conversation_id") WHERE "calls"."end_at" IS NULL;--> statement-breakpoint
CREATE INDEX "calls_conversation_started_idx" ON "calls" USING btree ("conversation_id","started_at" DESC NULLS LAST);