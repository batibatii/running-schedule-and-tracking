import { db } from "@/lib/db";
import { weeklyWorkouts } from "@/lib/db/schema";
import { eq, and, or, isNull, inArray, asc, max } from "drizzle-orm";
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
    )
    .orderBy(asc(weeklyWorkouts.sortOrder), asc(weeklyWorkouts.createdAt));

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
  const [{ maxSort }] = await db
    .select({ maxSort: max(weeklyWorkouts.sortOrder) })
    .from(weeklyWorkouts)
    .where(
      and(
        eq(weeklyWorkouts.userId, userId),
        eq(weeklyWorkouts.dayOfWeek, validatedData.dayOfWeek),
        eq(weeklyWorkouts.weekStartDate, validatedData.weekStartDate),
      ),
    );

  const nextSortOrder = (maxSort ?? 0) + 1;

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
      sortOrder: nextSortOrder,
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
// Reordering within a day
// ---------------------------------------------------------------------------

/**
 * Batch-update sortOrder for all workouts in a day based on the provided
 * ordered array of workout IDs. Each ID gets sortOrder = its array index.
 * Validates that all IDs belong to the same user, day, and week.
 */
export async function reorderWorkoutsInDay(
  userId: string,
  orderedIds: string[],
) {
  if (orderedIds.length === 0) return;

  await db.transaction(async (transaction) => {
    // Validate all IDs belong to the same user + day + week
    const targetWorkouts = await transaction
      .select({
        id: weeklyWorkouts.id,
        dayOfWeek: weeklyWorkouts.dayOfWeek,
        weekStartDate: weeklyWorkouts.weekStartDate,
      })
      .from(weeklyWorkouts)
      .where(
        and(
          eq(weeklyWorkouts.userId, userId),
          inArray(weeklyWorkouts.id, orderedIds),
        ),
      );

    if (targetWorkouts.length !== orderedIds.length) {
      throw new Error("Some workout IDs do not belong to this user");
    }

    const uniqueDays = new Set(
      targetWorkouts.map((workout) => workout.dayOfWeek),
    );
    const uniqueWeeks = new Set(
      targetWorkouts.map((workout) => workout.weekStartDate),
    );
    if (uniqueDays.size > 1 || uniqueWeeks.size > 1) {
      throw new Error("Cannot reorder workouts across different days or weeks");
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await transaction
        .update(weeklyWorkouts)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(
          and(
            eq(weeklyWorkouts.id, orderedIds[i]),
            eq(weeklyWorkouts.userId, userId),
          ),
        );
    }
  });
}

// ---------------------------------------------------------------------------
// Move workout to a different day at a specific position
// ---------------------------------------------------------------------------

/**
 * Move a workout to a new day and insert it at the given index among
 * that day's existing workouts. All sort orders in the target day are
 * recalculated within a single transaction.
 */
export async function moveWorkoutToDay(
  workoutId: string,
  userId: string,
  newDay: string,
  weekStartDate: string,
  insertAtIndex: number,
) {
  await db.transaction(async (transaction) => {
    // 1. Move the workout to the target day
    await transaction
      .update(weeklyWorkouts)
      .set({ dayOfWeek: newDay, updatedAt: new Date() })
      .where(
        and(
          eq(weeklyWorkouts.id, workoutId),
          eq(weeklyWorkouts.userId, userId),
        ),
      );

    // 2. Fetch all workouts now in the target day, ordered
    const dayWorkouts = await transaction
      .select({ id: weeklyWorkouts.id })
      .from(weeklyWorkouts)
      .where(
        and(
          eq(weeklyWorkouts.userId, userId),
          eq(weeklyWorkouts.dayOfWeek, newDay),
          eq(weeklyWorkouts.weekStartDate, weekStartDate),
        ),
      )
      .orderBy(asc(weeklyWorkouts.sortOrder), asc(weeklyWorkouts.createdAt));

    // 3. Remove the moved workout, then re-insert at desired index
    const ids = dayWorkouts.map((workout) => workout.id);
    const currentPos = ids.indexOf(workoutId);
    if (currentPos !== -1) {
      ids.splice(currentPos, 1);
    }
    const clampedIndex = Math.min(insertAtIndex, ids.length);
    ids.splice(clampedIndex, 0, workoutId);

    // 4. Batch-update sort orders
    for (let i = 0; i < ids.length; i++) {
      await transaction
        .update(weeklyWorkouts)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(
          and(eq(weeklyWorkouts.id, ids[i]), eq(weeklyWorkouts.userId, userId)),
        );
    }
  });
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
