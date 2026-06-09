import { tool, zodSchema } from "ai";
import { z } from "zod";
import type { PillFieldType } from "@/types/playground";

const parametersSchema = z.object({
  fieldType: z.enum([
    "sport",
    "workoutType",
    "heartRateZone",
    "distance",
    "pace",
  ]),
  value: z.union([z.string(), z.number()]),
  label: z
    .string()
    .describe("Human-readable label for the pill, e.g. '5 km', 'Tempo'"),
});

type Params = z.infer<typeof parametersSchema>;

interface CreatePillResult {
  action: "createPill";
  pill: {
    fieldType: PillFieldType;
    value: string | number;
    label: string;
  };
}

export function createPillTool() {
  return tool<Params, CreatePillResult>({
    description:
      "Create a workout building block (pill) in the playground. Use when the user describes a workout without specifying a day.",
    inputSchema: zodSchema(parametersSchema),
    execute: async (params) => {
      // Pills live in localStorage, the actual creation happens client-side
      // via onToolCall. We return the data for the client to handle.
      return {
        action: "createPill",
        pill: {
          fieldType: params.fieldType,
          value: params.value,
          label: params.label,
        },
      };
    },
  });
}
