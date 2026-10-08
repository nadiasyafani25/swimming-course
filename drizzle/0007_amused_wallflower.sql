ALTER TABLE "users" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "users_role_is_active_idx" ON "users" USING btree ("role","is_active");