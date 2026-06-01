import { getStravaActivity, listStravaActivities } from "./client";
import {
  upsertActivityFromStrava,
  deleteActivityByStravaId,
  getActivityByStravaId,
} from "@/lib/dal/activities";
import { unlinkWorkoutFromActivity } from "@/lib/dal/workout";
import { extractErrorMessage } from "@/lib/utils/error";
import { metersToKm, calculatePaceDecimal } from "@/lib/utils/pace";
import { daysAgoTimestamp } from "@/lib/utils/date";
import { STRAVA_SPORT_MAP } from "./types";
import { matchActivityToWorkout, matchActivitiesToWorkouts } from "./matching";
import type { ActivityMatchEntry } from "./matching";
import type { StravaSummaryActivity, StravaDetailedActivity } from "./types";
import type { NewActivity } from "@/lib/db/schema";

/**
 * Transform a Strava activity into our NewActivity schema.
 * Returns null for unsupported sport types (only running, cycling, swimming are accepted).
 *
 * Unit conversions:
 *   distance:  meters → kilometers (via metersToKm)
 *   duration:  moving_time in seconds (kept as-is)
 *   pace:      decimal min/km (via calculatePaceDecimal)
 *   elevation: meters (kept as-is)
 */
function mapStravaActivityToNewActivity(
  activity: StravaSummaryActivity | StravaDetailedActivity,
  userId: string,
): NewActivity | null {
  const sport =
    STRAVA_SPORT_MAP[activity.sport_type] ??
    STRAVA_SPORT_MAP[activity.type] ??
    null;

  if (sport === null) {
    return null;
  }

  const distanceKm = metersToKm(activity.distance);
  const durationSeconds = activity.moving_time;
  const paceMinPerKm = calculatePaceDecimal(distanceKm, durationSeconds);

  return {
    userId,
    sport,
    title: activity.name,
    distance: String(distanceKm),
    duration: durationSeconds,
    pace: paceMinPerKm ? String(paceMinPerKm) : null,
    calories: activity.calories ?? null,
    elevationGain: activity.total_elevation_gain
      ? String(activity.total_elevation_gain)
      : null,
    averageHeartRate: activity.average_heartrate
      ? Math.round(activity.average_heartrate)
      : null,
    maxHeartRate: activity.max_heartrate
      ? Math.round(activity.max_heartrate)
      : null,
    activityDate: new Date(activity.start_date),
    isCompleted: true,
    stravaActivityId: String(activity.id),
    stravaData: activity,
  };
}

export async function syncSingleActivity(
  userId: string,
  activityId: number,
): Promise<{ skipped: boolean }> {
  const detailed = await getStravaActivity(userId, activityId);
  const newActivity = mapStravaActivityToNewActivity(detailed, userId);

  if (newActivity === null) {
    console.log(
      `[Strava Sync] Skipping unsupported sport type: ${detailed.sport_type ?? detailed.type}`,
    );
    return { skipped: true };
  }

  const saved = await upsertActivityFromStrava(newActivity);
  await matchActivityToWorkout(userId, saved.id, new Date(detailed.start_date));

  return { skipped: false };
}

export async function syncActivitiesForPeriod(
  userId: string,
  days: number = 30,
): Promise<{
  synced: number;
  errors: number;
  matched: number;
  unmatched: number;
}> {
  const after = daysAgoTimestamp(days);
  const PER_PAGE = 200;

  let synced = 0;
  let errors = 0;
  let page = 1;
  const activitiesToMatch: ActivityMatchEntry[] = [];

  // Paginate until Strava returns fewer than perPage results
  while (true) {
    const summaries = await listStravaActivities(userId, {
      after,
      perPage: PER_PAGE,
      page,
    });

    for (const summary of summaries) {
      try {
        const newActivity = mapStravaActivityToNewActivity(summary, userId);
        if (newActivity === null) continue; // Skip unsupported sport types
        const saved = await upsertActivityFromStrava(newActivity);
        activitiesToMatch.push({
          id: saved.id,
          date: new Date(summary.start_date),
        });
        synced++;
      } catch (error) {
        errors++;
        console.error(
          `[Strava Sync] Failed to sync activity ${summary.id}:`,
          extractErrorMessage(error),
        );
      }
    }

    if (summaries.length < PER_PAGE) break;
    page++;
  }

  // Run optimal batch matching after all upserts complete
  const matchResult = await matchActivitiesToWorkouts(
    userId,
    activitiesToMatch,
  );

  return {
    synced,
    errors,
    matched: matchResult.matched,
    unmatched: matchResult.unmatched,
  };
}

export async function handleStravaDelete(
  userId: string,
  activityId: number,
): Promise<void> {
  const stravaIdStr = String(activityId);

  // Find the internal activity to get its UUID for the unlink query
  const activity = await getActivityByStravaId(stravaIdStr);
  if (activity) {
    await unlinkWorkoutFromActivity(activity.id, userId);
  }

  await deleteActivityByStravaId(stravaIdStr, userId);
}
