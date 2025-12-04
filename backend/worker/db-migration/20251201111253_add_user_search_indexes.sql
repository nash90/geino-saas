-- Enable pg_trgm extension for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "idx_users_firstname_trgm" ON "users" USING gin ("firstname" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_lastname_trgm" ON "users" USING gin ("lastname" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email_trgm" ON "users" USING gin ("email" gin_trgm_ops);