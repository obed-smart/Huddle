ALTER TABLE "group_join_requests" RENAME COLUMN "requested_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "group_join_requests" DROP CONSTRAINT "group_join_requests_requested_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "group_join_requests_user_idx";--> statement-breakpoint
ALTER TABLE "group_join_requests" ADD CONSTRAINT "group_join_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "group_join_requests_user_idx" ON "group_join_requests" USING btree ("user_id");