ALTER TABLE "conversation_participants" DROP CONSTRAINT "conversation_participants_last_read_message_id_messages_id_fk";
--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "visibility" SET DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_last_read_message_id_messages_id_fk" FOREIGN KEY ("last_read_message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" DROP COLUMN "max_conversation_admin";--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversation_type_invariants" CHECK (
    (
      "conversations"."type" = 'direct'
      AND "conversations"."visibility" = 'private'
      AND "conversations"."name" IS NULL
      AND "conversations"."description" IS NULL
      AND "conversations"."avatar_url" IS NULL
      AND "conversations"."invite_code" IS NULL
      AND "conversations"."direct_key" IS NOT NULL
    )
    OR
    (
      "conversations"."type" = 'group'
      AND "conversations"."name" IS NOT NULL
      AND "conversations"."direct_key" IS NULL
      AND "conversations"."ping_status" IS NULL
      AND "conversations"."requested_by" IS NULL
    )
);