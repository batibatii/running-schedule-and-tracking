import { tool, zodSchema } from "ai";
import { z } from "zod";
import { SPORTS, WORKOUT_TYPES } from "@/types/workout";
import type { PartialWorkoutFields } from "@/types/playground";

const parametersSchema = z.object({
  sport: z.enum(SPORTS).optional().describe("Sport type, e.g. running"),
  workoutType: z
    .enum(WORKOUT_TYPES)
    .optional()
    .describe("Workout type, e.g. easy, tempo"),
  heartRateZone: z
    .enum(["zone-1", "zone-2", "zone-3", "zone-4", "zone-5"])
    .optional()
    .describe("Heart rate zone"),
  distance: z.number().positive().optional().describe("Distance in kilometers"),
  pace: z
    .string()
    .regex(/^\d{1,2}:\d{2}$/)
    .optional()
    .describe("Pace in MM:SS format"),
});

type Params = z.infer<typeof parametersSchema>;

interface CreatePlaygroundWorkoutResult {
  action: "createPlaygroundWorkout";
  fields: PartialWorkoutFields;
}

export function createPlaygroundWorkoutTool() {
  return tool<Params, CreatePlaygroundWorkoutResult>({
    description:
      "Create a combined workout card in the playground area. Use when the user describes a workout with multiple attributes (e.g. '10km easy run') without specifying a day. Do NOT use this for single-attribute descriptions — use createPill instead.",
    inputSchema: zodSchema(parametersSchema),
    execute: async (params) => {
      const fields: PartialWorkoutFields = {};
      if (params.sport) fields.sport = params.sport;
      if (params.workoutType) fields.workoutType = params.workoutType;
      if (params.heartRateZone) fields.heartRateZone = params.heartRateZone;
      if (params.distance) fields.distance = params.distance;
      if (params.pace) fields.pace = params.pace;

      return {
        action: "createPlaygroundWorkout",
        fields,
      };
    },
  });
}
