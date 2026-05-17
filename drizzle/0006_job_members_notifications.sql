-- Job members (many-to-many: jobs ↔ users)
CREATE TABLE IF NOT EXISTS "job_member" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_id" uuid NOT NULL REFERENCES "job"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "added_by_id" text REFERENCES "user"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "job_member_job_id_user_id_unique" UNIQUE ("job_id", "user_id")
);

-- In-app notifications
CREATE TABLE IF NOT EXISTS "notification" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "job_id" uuid REFERENCES "job"("id") ON DELETE SET NULL,
  "client_id" uuid REFERENCES "client"("id") ON DELETE SET NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);
