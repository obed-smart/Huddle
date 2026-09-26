CREATE TABLE
	"sessions" (
		"id" uuid PRIMARY KEY DEFAULT gen_random_uuid () NOT NULL,
		"user_id" uuid NOT NULL,
		"created_at" timestamp
		with
			time zone DEFAULT now () NOT NULL,
			"last_seen_at" timestamp
		with
			time zone DEFAULT now () NOT NULL,
			"revoked_at" timestamp
		with
			time zone
	);

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
DROP CONSTRAINT "refresh_tokens_user_id_users_id_fk";

--> statement-breakpoint
DROP INDEX "refresh_tokens_user_id_idx";

--> statement-breakpoint
DROP INDEX "refresh_token_family_idx";

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
ADD COLUMN "session_id" uuid NOT NULL;

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
ADD COLUMN "used_at" timestamp
with
	time zone;

--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id", "revoked_at");

--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX "refresh_tokens_session_idx" ON "refresh_tokens" USING btree ("session_id");

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
DROP COLUMN "user_id";

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
DROP COLUMN "family_id";

--> statement-breakpoint
ALTER TABLE "refresh_tokens"
DROP COLUMN "revoked_at";