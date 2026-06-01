import { getActivityById, getActivitiesByIds } from "@/lib/dal/activities";
import {
  getEligibleWorkoutsForMatching,
  linkWorkoutToActivity,
} from "@/lib/dal/workout";
import { getDayOfWeek, formatDateToISO } from "@/lib/utils/date";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MatchResult {
  workoutId: string | null;
  status: "completed" | "missed" | "unmatched";
}

/** Entry collected during bulk sync for batch matching. */
export interface ActivityMatchEntry {
  id: string;
  date: Date;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimum ratio of actual/planned distance to count as completed. */
const COMPLETION_THRESHOLD = 0.8;

/**
 * Derive the weekStartDate (Monday ISO) and dayOfWeek from an activity date.
 * Uses local timezone — consistent with how the schedule page computes dates.
 */
function getWorkoutSlot(activityDate: Date): {
  weekStartDate: string;
  dayOfWeek: string;
} {
  const dayOfWeek = getDayOfWeek(activityDate);

  // Compute Monday of the same week
  const dayIndex = activityDate.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = dayIndex === 0 ? 6 : dayIndex - 1;
  const monday = new Date(activityDate);
  monday.setDate(activityDate.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  return {
    weekStartDate: formatDateToISO(monday),
    dayOfWeek,
  };
}

/** Build a grouping key for activities on the same day and sport. */
function buildSlotKey(
  weekStartDate: string,
  dayOfWeek: string,
  sport: string,
): string {
  return `${weekStartDate}::${dayOfWeek}::${sport}`;
}

/**
 * Determine completion status from actual vs planned distance.
 * A workout with no planned distance is always completed by any activity.
 */
function resolveCompletionStatus(
  actualDistanceKm: number,
  plannedDistanceKm: number,
): "completed" | "missed" {
  if (plannedDistanceKm === 0) return "completed";
  return actualDistanceKm >= plannedDistanceKm * COMPLETION_THRESHOLD
    ? "completed"
    : "missed";
}

// ---------------------------------------------------------------------------
// Single-activity matching (webhook create/update events)
// ---------------------------------------------------------------------------

/**
 * Match a single synced activity to the best-fit planned workout.
 *
 * Matching rules:
 *  1. Candidate query: same userId + sport + dayOfWeek + weekStartDate,
 *     excluding manual completions and already-linked workouts (unless linked
 *     to this same activity — allows re-matching on update events).
 *  2. Best candidate: closest planned distance to actual distance.
 *  3. Distance comparison:
 *     - plannedDistance is 0 or actual >= planned * 0.8 → completed
 *     - actual < planned * 0.8 → missed
 *  4. No candidates → unmatched (standalone activity).
 */
export async function matchActivityToWorkout(
  userId: string,
  activityId: string,
  activityDate: Date,
): Promise<MatchResult> {
  const activity = await getActivityById(activityId);
  if (!activity) return { workoutId: null, status: "unmatched" };

  const { weekStartDate, dayOfWeek } = getWorkoutSlot(activityDate);
  const actualDistanceKm = activity.distance ? Number(activity.distance) : 0;
  const actualDurationMinutes = activity.duration
    ? activity.duration / 60
    : null;

  const eligibleWorkouts = await getEligibleWorkoutsForMatching(
    userId,
    activity.sport,
    dayOfWeek,
    weekStartDate,
    [activityId], // Allow re-matching workouts already linked to this activity
  );

  if (eligibleWorkouts.length === 0) {
    return { workoutId: null, status: "unmatched" };
  }

  // Pick best candidate: closest planned distance to actual distance
  const bestWorkout = eligibleWorkouts.reduce((best, candidate) => {
    const diffCandidate = Math.abs(
      (Number(candidate.distance) || 0) - actualDistanceKm,
    );
    const diffBest = Math.abs((Number(best.distance) || 0) - actualDistanceKm);
    return diffCandidate < diffBest ? candidate : best;
  });

  const plannedDistanceKm = Number(bestWorkout.distance) || 0;
  const status = resolveCompletionStatus(actualDistanceKm, plannedDistanceKm);

  await linkWorkoutToActivity(bestWorkout.id, userId, {
    linkedActivityId: activityId,
    completed: status === "completed",
    actualDistance: actualDistanceKm,
    actualDuration: actualDurationMinutes,
  });

  return { workoutId: bestWorkout.id, status };
}

// ---------------------------------------------------------------------------
// Batch matching with optimal pairing (used by syncActivitiesForPeriod)
// ---------------------------------------------------------------------------

/** Parsed activity data needed for pairing. */
interface SlotActivity {
  activityId: string;
  sport: string;
  distanceKm: number;
  durationSeconds: number | null;
  weekStartDate: string;
  dayOfWeek: string;
}

/** A candidate (activity, workout) pair with its distance difference. */
interface PairingCandidate {
  activityId: string;
  workoutId: string;
  distanceKm: number;
  durationSeconds: number | null;
  plannedDistanceKm: number;
  distanceDiff: number;
}

/**
 * Match multiple activities to planned workouts using optimal pairing.
 *
 * Instead of processing activities one-by-one (greedy, order-dependent),
 * this groups activities by (day + sport), fetches all eligible workouts
 * per group, and pairs them by smallest distance difference first.
 *
 * Example: Monday has workouts [5km easy, 10km long] and activities
 * [4.8km, 9.5km]. Greedy could mis-pair them. Optimal pairing computes
 * all combinations, sorts by distance diff, and assigns the closest
 * pairs first — so 4.8→5km and 9.5→10km.
 */
export async function matchActivitiesToWorkouts(
  userId: string,
  entries: ActivityMatchEntry[],
): Promise<{ matched: number; unmatched: number }> {
  if (entries.length === 0) return { matched: 0, unmatched: 0 };

  const activityRows = await getActivitiesByIds(
    entries.map((entry) => entry.id),
  );
  const activityById = new Map(
    activityRows.map((activity) => [activity.id, activity]),
  );

  // Group entries by (weekStartDate, dayOfWeek, sport) slot
  const slotGroups = new Map<string, SlotActivity[]>();

  for (const entry of entries) {
    const activity = activityById.get(entry.id);
    if (!activity) continue;

    const { weekStartDate, dayOfWeek } = getWorkoutSlot(entry.date);
    const key = buildSlotKey(weekStartDate, dayOfWeek, activity.sport);

    if (!slotGroups.has(key)) slotGroups.set(key, []);
    slotGroups.get(key)!.push({
      activityId: activity.id,
      sport: activity.sport,
      distanceKm: activity.distance ? Number(activity.distance) : 0,
      durationSeconds: activity.duration,
      weekStartDate,
      dayOfWeek,
    });
  }

  let totalMatched = 0;
  let totalUnmatched = 0;

  for (const slotActivities of slotGroups.values()) {
    const { weekStartDate, dayOfWeek, sport } = slotActivities[0];
    const slotActivityIds = slotActivities.map(
      (slotActivity) => slotActivity.activityId,
    );

    const eligibleWorkouts = await getEligibleWorkoutsForMatching(
      userId,
      sport,
      dayOfWeek,
      weekStartDate,
      slotActivityIds,
    );

    if (eligibleWorkouts.length === 0) {
      totalUnmatched += slotActivities.length;
      continue;
    }

    // Build all (activity, workout) pairing candidates with distance diff
    const pairingCandidates: PairingCandidate[] = [];

    for (const slotActivity of slotActivities) {
      for (const workout of eligibleWorkouts) {
        const plannedDistanceKm = Number(workout.distance) || 0;
        pairingCandidates.push({
          activityId: slotActivity.activityId,
          workoutId: workout.id,
          distanceKm: slotActivity.distanceKm,
          durationSeconds: slotActivity.durationSeconds,
          plannedDistanceKm,
          distanceDiff: Math.abs(slotActivity.distanceKm - plannedDistanceKm),
        });
      }
    }

    pairingCandidates.sort(
      (candidateA, candidateB) =>
        candidateA.distanceDiff - candidateB.distanceDiff,
    );

    const claimedActivityIds = new Set<string>();
    const claimedWorkoutIds = new Set<string>();

    for (const candidate of pairingCandidates) {
      if (
        claimedActivityIds.has(candidate.activityId) ||
        claimedWorkoutIds.has(candidate.workoutId)
      ) {
        continue;
      }

      claimedActivityIds.add(candidate.activityId);
      claimedWorkoutIds.add(candidate.workoutId);

      const status = resolveCompletionStatus(
        candidate.distanceKm,
        candidate.plannedDistanceKm,
      );
      const actualDurationMinutes = candidate.durationSeconds
        ? candidate.durationSeconds / 60
        : null;

      await linkWorkoutToActivity(candidate.workoutId, userId, {
        linkedActivityId: candidate.activityId,
        completed: status === "completed",
        actualDistance: candidate.distanceKm,
        actualDuration: actualDurationMinutes,
      });

      totalMatched++;
    }

    const slotUnmatchedCount = slotActivities.length - claimedActivityIds.size;
    totalUnmatched += slotUnmatchedCount;
  }

  return { matched: totalMatched, unmatched: totalUnmatched };
}
