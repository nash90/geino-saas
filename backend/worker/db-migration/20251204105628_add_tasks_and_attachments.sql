CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid,
	"comment_id" uuid,
	"file_name" varchar(500) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status_code" integer DEFAULT 1 NOT NULL,
	"type_code" integer,
	"priority_code" integer,
	"assigned_to" uuid,
	"created_by" uuid NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_attachments_task_id" ON "attachments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_comment_id" ON "attachments" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "idx_attachments_uploaded_by" ON "attachments" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_task_comments_task_id" ON "task_comments" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_comments_user_id" ON "task_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_project_id" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status_code" ON "tasks" USING btree ("status_code");--> statement-breakpoint
CREATE INDEX "idx_tasks_assigned_to" ON "tasks" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_tasks_created_by" ON "tasks" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_tasks_deadline" ON "tasks" USING btree ("deadline");