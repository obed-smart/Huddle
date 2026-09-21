CREATE TABLE "group_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"requested_user_id" uuid NOT NULL,
	"invited_by" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_invited_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_requested_user_id_users_id_fk" FOREIGN KEY ("requested_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_join_requests_conversation_idx" ON "group_join_requests" USING btree ("conversation_id","status");--> statement-breakpoint
CREATE INDEX "group_join_requests_user_idx" ON "group_join_requests" USING btree ("requested_user_id");--> statement-breakpoint
ALTER TABLE "conversation_participants" DROP COLUMN "invited_by";--> statement-breakpoint
ALTER TABLE "conversation_participants" DROP COLUMN "joined_at";