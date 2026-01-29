ALTER TABLE "weekly_workouts" ALTER COLUMN "duration" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "weekly_workouts" ADD COLUMN "pace" varchar(10);