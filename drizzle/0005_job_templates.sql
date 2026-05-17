CREATE TABLE "job_template" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "stages" jsonb NOT NULL DEFAULT '[]',
  "default_tasks" jsonb NOT NULL DEFAULT '[]',
  "is_system" boolean NOT NULL DEFAULT false,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_by_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_template" ADD CONSTRAINT "job_template_org_fkey"
  FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE "job_template" ADD CONSTRAINT "job_template_created_by_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "user"("id");
--> statement-breakpoint
CREATE UNIQUE INDEX "job_template_org_slug_unique"
  ON "job_template" ("organization_id", "slug");
--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "template_id" uuid;
--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_template_id_fkey"
  FOREIGN KEY ("template_id") REFERENCES "job_template"("id") ON DELETE SET NULL;
