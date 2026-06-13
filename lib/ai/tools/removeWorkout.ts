import { tool, zodSchema } from "ai";
import { z } from "zod";
import { deleteWorkout } from "@/lib/dal/workout";

const parametersSchema = z.object({
  workoutId: z
    .string()
    .describe(
      "The ID of the workout to remove. Pick from existing workouts in the week context.",
    ),
});

type Params = z.infer<typeof parametersSchema>;

interface RemoveWorkoutResult {
  action: "workoutRemoved";
  workoutId: string;
}

export function removeWorkoutTool(userId: string) {
  return tool<Params, RemoveWorkoutResult>({
    description:
      "Remove an existing workout from the schedule. Use when the user asks to delete, remove, or cancel a planned workout.",
    inputSchema: zodSchema(parametersSchema),
    execute: async (params) => {
      await deleteWorkout(params.workoutId, userId);

      return {
        action: "workoutRemoved",
        workoutId: params.workoutId,
      };
    },
  });
}
