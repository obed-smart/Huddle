CREATE TYPE "public"."attachment_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "attachments" RENAME COLUMN "url" TO "object_key";--> statement-breakpoint
ALTER TABLE "meet_invitees" DROP CONSTRAINT "meet_invitees_meet_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "attachments" ADD COLUMN "status" "attachment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "meet_invitees" ADD COLUMN "accepted_at" timestamp with time zone;