import { db } from "@/lib/db";
import { activities } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { NewActivity } from "@/lib/db/schema";

export async function getActivitiesByUserId(userId: string) {
  return db.select().from(activities).where(eq(activities.userId, userId));
}

export async function getActivityByStravaId(stravaActivityId: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.stravaActivityId, stravaActivityId));
  return activity;
}

/**
 * Insert or update an activity by stravaActivityId.
 * Uses ON CONFLICT DO UPDATE for idempotent sync —
 * safe to call multiple times for the same Strava activity.
 */
export async function upsertActivityFromStrava(data: NewActivity) {
  const [activity] = await db
    .insert(activities)
    .values(data)
    .onConflictDoUpdate({
      target: activities.stravaActivityId,
      set: {
        sport: data.sport,
        title: data.title,
        distance: data.distance,
        duration: data.duration,
        pace: data.pace,
        calories: data.calories,
        elevationGain: data.elevationGain,
        averageHeartRate: data.averageHeartRate,
        maxHeartRate: data.maxHeartRate,
        activityDate: data.activityDate,
        stravaData: data.stravaData,
        updatedAt: new Date(),
      },
    })
    .returning();

  return activity;
}

export async function deleteActivityByStravaId(stravaActivityId: string) {
  await db
    .delete(activities)
    .where(eq(activities.stravaActivityId, stravaActivityId));
}
