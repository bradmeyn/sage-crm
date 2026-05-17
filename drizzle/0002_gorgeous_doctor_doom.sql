CREATE TABLE "client_goal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"category" text DEFAULT 'OTHER' NOT NULL,
	"name" text NOT NULL,
	"target_amount" integer,
	"current_amount" integer DEFAULT 0 NOT NULL,
	"target_date" text,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_insurance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"category" text DEFAULT 'OTHER' NOT NULL,
	"insurer" text NOT NULL,
	"policy_number" text,
	"cover_amount" integer,
	"premium" integer,
	"premium_frequency" text DEFAULT 'MONTHLY' NOT NULL,
	"owner" text DEFAULT 'CLIENT' NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"start_date" text,
	"review_date" text,
	"notes" text,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_goal" ADD CONSTRAINT "client_goal_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_goal" ADD CONSTRAINT "client_goal_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_goal" ADD CONSTRAINT "client_goal_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_insurance" ADD CONSTRAINT "client_insurance_client_id_client_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."client"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_insurance" ADD CONSTRAINT "client_insurance_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_insurance" ADD CONSTRAINT "client_insurance_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;