-- Create parent table as PARTITIONED by month
CREATE TABLE "notifications" (
	"id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type_code" integer NOT NULL,
	"category_code" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"task_id" uuid,
	"project_id" uuid,
	"organization_id" uuid,
	"comment_id" uuid,
	"metadata" text,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	PRIMARY KEY ("id", "created_at")
) PARTITION BY RANGE ("created_at");
--> statement-breakpoint
-- Create initial partitions for next 6 months
CREATE TABLE "notifications_2025_01" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_02" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_03" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_04" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_05" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_06" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');
--> statement-breakpoint
CREATE TABLE "notifications_2025_07" PARTITION OF "notifications"
	FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');
--> statement-breakpoint
-- Create indexes (applies to all partitions)
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_notifications_category_code" ON "notifications" USING btree ("category_code");--> statement-breakpoint
CREATE INDEX "idx_notifications_type_code" ON "notifications" USING btree ("type_code");