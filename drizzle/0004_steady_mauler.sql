ALTER TABLE "users" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD COLUMN "linked_activity_id" uuid;--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD COLUMN "sync_status" varchar(20);--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD COLUMN "actual_distance" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD COLUMN "actual_duration" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD CONSTRAINT "weekly_workouts_linked_activity_id_activities_id_fk" FOREIGN KEY ("linked_activity_id") REFERENCES "public"."activities"("id") ON DELETE set null ON UPDATE no action;