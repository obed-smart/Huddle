ALTER TABLE "conversation_participants" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "role" SET DEFAULT 'member'::text;--> statement-breakpoint
DROP TYPE "public"."conversation_role";--> statement-breakpoint
CREATE TYPE "public"."conversation_role" AS ENUM('super_admin', 'admin', 'member');--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "role" SET DEFAULT 'member'::"public"."conversation_role";--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "role" SET DATA TYPE "public"."conversation_role" USING "role"::"public"."conversation_role";