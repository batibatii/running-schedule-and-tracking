import { db } from "@/lib/db";
import { activities, weeklyWorkouts } from "@/lib/db/schema";
import { eq, and, inArray, gte, lt, notInArray } from "drizzle-orm";
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

export async function getActivityById(activityId: string) {
  const [activity] = await db
    .select()
    .from(activities)
    .where(eq(activities.id, activityId));
  return activity;
}

export async function getActivitiesByIds(activityIds: string[]) {
  if (activityIds.length === 0) return [];
  return db
    .select()
    .from(activities)
    .where(inArray(activities.id, activityIds));
}

/**
 * Get activities for a week that aren't linked to any planned workout.
 * Used to populate standalone activity cards in the schedule view.
 *
 * @param weekStartDate  ISO "YYYY-MM-DD" — Monday of the week
 */
export async function getUnmatchedActivitiesForWeek(
  userId: string,
  weekStartDate: string,
) {
  // 7-day window: [Monday 00:00 UTC, next Monday 00:00 UTC)
  const weekStart = new Date(weekStartDate + "T00:00:00.000Z");
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  // Collect IDs of activities already linked to a planned workout this week
  const linkedRows = await db
    .select({ linkedActivityId: weeklyWorkouts.linkedActivityId })
    .from(weeklyWorkouts)
    .where(
      and(
        eq(weeklyWorkouts.userId, userId),
        eq(weeklyWorkouts.weekStartDate, weekStartDate),
      ),
    );

  const linkedActivityIds = linkedRows
    .map((row) => row.linkedActivityId)
    .filter((id): id is string => id !== null);

  // Base conditions: same user, activity date within the week
  const baseConditions = and(
    eq(activities.userId, userId),
    gte(activities.activityDate, weekStart),
    lt(activities.activityDate, weekEnd),
  );

  // Exclude already-linked activities if any exist
  if (linkedActivityIds.length > 0) {
    return db
      .select()
      .from(activities)
      .where(and(baseConditions, notInArray(activities.id, linkedActivityIds)));
  }

  return db.select().from(activities).where(baseConditions);
}

export async function deleteActivityByStravaId(
  stravaActivityId: string,
  userId: string,
) {
  await db
    .delete(activities)
    .where(
      and(
        eq(activities.stravaActivityId, stravaActivityId),
        eq(activities.userId, userId),
      ),
    );
}
