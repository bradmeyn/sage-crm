CREATE TABLE "job_comment" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_by_id" text NOT NULL,
  "updated_by_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_activity" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "type" text NOT NULL,
  "body" text NOT NULL,
  "created_by_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_document" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL,
  "file_path" text NOT NULL,
  "name" text NOT NULL,
  "size" integer,
  "mime_type" text,
  "created_by_id" text,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_comment" ADD CONSTRAINT "job_comment_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "job_comment" ADD CONSTRAINT "job_comment_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "user"("id");
--> statement-breakpoint
ALTER TABLE "job_activity" ADD CONSTRAINT "job_activity_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "job_activity" ADD CONSTRAINT "job_activity_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "user"("id");
--> statement-breakpoint
ALTER TABLE "job_document" ADD CONSTRAINT "job_document_job_id_fkey"
  FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE;
