ALTER TABLE "runs" RENAME TO "activities";--> statement-breakpoint
ALTER TABLE "activities" RENAME COLUMN "run_date" TO "activity_date";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "runs_strava_activity_id_unique";--> statement-breakpoint
ALTER TABLE "activities" DROP CONSTRAINT "runs_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "sport" varchar(50) DEFAULT 'running' NOT NULL;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "average_heart_rate" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "max_heart_rate" integer;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_strava_activity_id_unique" UNIQUE("strava_activity_id");
