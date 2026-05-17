CREATE TABLE "job_client" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "job_id" uuid NOT NULL,
    "client_id" uuid NOT NULL,
    CONSTRAINT "job_client_job_id_client_id_unique" UNIQUE("job_id","client_id")
);
--> statement-breakpoint
ALTER TABLE "job_client" ADD CONSTRAINT "job_client_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE NOT DEFERRABLE;
--> statement-breakpoint
ALTER TABLE "job_client" ADD CONSTRAINT "job_client_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE CASCADE NOT DEFERRABLE;
--> statement-breakpoint
INSERT INTO "job_client" ("job_id", "client_id")
    SELECT "id", "client_id" FROM "job" WHERE "client_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "job" DROP COLUMN "client_id";
