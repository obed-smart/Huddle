DROP INDEX "refresh_tokens_user_id_idx";--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD COLUMN "family_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "refresh_token_family_idx" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens" USING btree ("user_id","revoked_at");