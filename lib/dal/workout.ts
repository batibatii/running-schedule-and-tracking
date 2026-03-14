import { db } from "@/lib/db";
import { weeklyWorkouts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
