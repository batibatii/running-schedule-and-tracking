import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateWorkoutSchema } from "@/types/workout";
import {
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} from "@/lib/dal/workout";
import z from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();

    const verifiedWorkout = await getWorkoutById(id, user.id);

    if (!verifiedWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const validatedData = updateWorkoutSchema.parse(body);

    const updatedWorkout = await updateWorkout(id, user.id, validatedData);

    return NextResponse.json(updatedWorkout, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to send workout to database");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireAuth();

    const verifiedWorkout = await getWorkoutById(id, user.id);

    if (!verifiedWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    await deleteWorkout(id, user.id);

    return NextResponse.json({ message: "Workout deleted" }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Failed to send workout to database");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
