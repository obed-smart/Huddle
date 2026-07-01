CREATE TYPE "public"."conversation_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group');--> statement-breakpoint
CREATE TYPE "public"."conversation_visibility" AS ENUM('private', 'public');--> statement-breakpoint
CREATE TYPE "public"."friendship_status" AS ENUM('pending', 'accepted', 'rejected', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."global_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'video', 'audio', 'voice', 'file', 'system');--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password_hash" text,
	"googleId" text,
	"avatar_url" text,
	"avatar_color" varchar(20),
	"bio" varchar(255),
	"global_role" "global_role" DEFAULT 'user' NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"password_reset_otp" text,
	"password_reset_expires_at" timestamp with time zone,
	"password_reset_attempts" integer,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "refresh_token_hash_idx" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");