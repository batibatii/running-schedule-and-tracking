import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import z from "zod";
import { getWorkouts, createWorkout } from "@/lib/dal/workout";
import { createWorkoutSchema } from "@/types/workout";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const weekStartDate = searchParams.get("weekStartDate");

    const workouts = await getWorkouts(user.id, weekStartDate);

    return NextResponse.json(workouts);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to fetch workouts", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const validatedData = createWorkoutSchema.parse(body);

    const newWorkout = await createWorkout(user.id, validatedData);

    return NextResponse.json(newWorkout, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 },
      );
    }
    console.error("Failed to send workout to database");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
