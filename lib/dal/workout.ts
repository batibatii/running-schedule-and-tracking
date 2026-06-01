import { db } from "@/lib/db";
import { weeklyWorkouts } from "@/lib/db/schema";
import { eq, and, or, isNull, inArray } from "drizzle-orm";
import { CreateWorkoutInputType } from "@/types/workoutValidation";

export async function getWorkouts(
  userId: string,
  weekStartDate?: string | null,
) {
  const workouts = await db
    .select()
    .from(weeklyWorkouts)
    .where(
      weekStartDate
        ? and(
            eq(weeklyWorkouts.userId, userId),
            eq(weeklyWorkouts.weekStartDate, weekStartDate),
          )
        : eq(weeklyWorkouts.userId, userId),
    );

  return workouts;
}

export async function getWorkoutById(workoutId: string, userId: string) {
  const [workout] = await db
    .select()
    .from(weeklyWorkouts)
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    );
  return workout;
}

export async function createWorkout(
  userId: string,
  validatedData: CreateWorkoutInputType,
) {
  const [newWorkout] = await db
    .insert(weeklyWorkouts)
    .values({
      userId,
      ...validatedData,
      distance: String(validatedData.distance),
      duration:
        validatedData.duration !== undefined
          ? String(validatedData.duration)
          : undefined,
    })
    .returning();

  return newWorkout;
}

export async function updateWorkout(
  workoutId: string,
  userId: string,
  validatedData: Partial<CreateWorkoutInputType> & { completed?: boolean },
) {
  const { distance, duration, sport, ...rest } = validatedData;

  const [updatedWorkout] = await db
    .update(weeklyWorkouts)
    .set({
      ...rest,
      ...(distance !== undefined ? { distance: String(distance) } : {}),
      ...(duration !== undefined ? { duration: String(duration) } : {}),
      ...(sport !== undefined ? { sport } : {}),
    })
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    )
    .returning();
  return updatedWorkout;
}

export async function deleteWorkout(workoutId: string, userId: string) {
  await db
    .delete(weeklyWorkouts)
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    );
}

// ---------------------------------------------------------------------------
// Matching-related queries
// ---------------------------------------------------------------------------

/**
 * Fetch planned workouts eligible for activity matching in a specific slot
 * (same user + sport + day + week). Excludes manual completions (sticky).
 * Allows re-matching workouts already linked to the given activity IDs
 * (handles Strava update events gracefully).
 */
export async function getEligibleWorkoutsForMatching(
  userId: string,
  sport: string,
  dayOfWeek: string,
  weekStartDate: string,
  allowLinkedToActivityIds: string[] = [],
) {
  return db
    .select()
    .from(weeklyWorkouts)
    .where(
      and(
        eq(weeklyWorkouts.userId, userId),
        eq(weeklyWorkouts.sport, sport),
        eq(weeklyWorkouts.dayOfWeek, dayOfWeek),
        eq(weeklyWorkouts.weekStartDate, weekStartDate),
        or(
          isNull(weeklyWorkouts.syncStatus),
          eq(weeklyWorkouts.syncStatus, "strava"),
        ),
        allowLinkedToActivityIds.length > 0
          ? or(
              isNull(weeklyWorkouts.linkedActivityId),
              inArray(
                weeklyWorkouts.linkedActivityId,
                allowLinkedToActivityIds,
              ),
            )
          : isNull(weeklyWorkouts.linkedActivityId),
      ),
    );
}

export async function linkWorkoutToActivity(
  workoutId: string,
  userId: string,
  data: {
    linkedActivityId: string;
    completed: boolean;
    actualDistance: number;
    actualDuration: number | null;
  },
) {
  const [updated] = await db
    .update(weeklyWorkouts)
    .set({
      linkedActivityId: data.linkedActivityId,
      syncStatus: "strava",
      completed: data.completed,
      actualDistance: String(data.actualDistance),
      actualDuration: data.actualDuration ? String(data.actualDuration) : null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    )
    .returning();
  return updated;
}

export async function setWorkoutManualStatus(
  workoutId: string,
  userId: string,
  completed: boolean,
) {
  const [updated] = await db
    .update(weeklyWorkouts)
    .set({
      syncStatus: "manual",
      completed,
      updatedAt: new Date(),
    })
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    )
    .returning();
  return updated;
}

export async function resetWorkoutToPlanned(workoutId: string, userId: string) {
  const [updated] = await db
    .update(weeklyWorkouts)
    .set({
      syncStatus: null,
      completed: false,
      linkedActivityId: null,
      actualDistance: null,
      actualDuration: null,
      updatedAt: new Date(),
    })
    .where(
      and(eq(weeklyWorkouts.id, workoutId), eq(weeklyWorkouts.userId, userId)),
    )
    .returning();
  return updated;
}

/**
 * Unlink a workout from its activity. Resets sync fields to their default
 * (unlinked) state. Only affects strava-matched workouts, never manual ones.
 */
export async function unlinkWorkoutFromActivity(
  linkedActivityId: string,
  userId: string,
) {
  await db
    .update(weeklyWorkouts)
    .set({
      linkedActivityId: null,
      syncStatus: null,
      completed: false,
      actualDistance: null,
      actualDuration: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(weeklyWorkouts.linkedActivityId, linkedActivityId),
        eq(weeklyWorkouts.userId, userId),
        eq(weeklyWorkouts.syncStatus, "strava"),
      ),
    );
}
