"use client";

import { useRef, useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import type { WeekContext, TrainingPlan } from "@/types/ai";
import { asResolvedToolPart } from "@/types/ai";
import { formatDateDisplay } from "@/lib/utils/date";
import type {
  PillFieldType,
  PillGroup,
  Pill,
  PartialWorkoutFields,
} from "@/types/playground";

type UndoEntry =
  | { type: "workout"; id: string; label: string }
  | { type: "playground"; id: string }
  | { type: "plan"; workoutIds: string[] };

interface UseAIChatOptions {
  weekContext: WeekContext;
  onWorkoutCreated: () => void;
  onWorkoutDeleted: () => void;
  onPlanApplied: () => void;
  addExistingPill: (pill: Pill) => boolean;
  addGroup: (group: PillGroup) => boolean;
  removePlaygroundItem: (id: string) => void;
  undoWorkout: (id: string) => Promise<void>;
  undoPlan: (workoutIds: string[]) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FIELD_PILL_CONFIG: {
  key: keyof PartialWorkoutFields;
  fieldType: PillFieldType;
  label: (v: string | number) => string;
}[] = [
  { key: "sport", fieldType: "sport", label: (v) => String(v) },
  { key: "workoutType", fieldType: "workoutType", label: (v) => String(v) },
  {
    key: "heartRateZone",
    fieldType: "heartRateZone",
    label: (v) => String(v),
  },
  { key: "distance", fieldType: "distance", label: (v) => `${v} km` },
  { key: "pace", fieldType: "pace", label: (v) => `${v} /km` },
];

function buildPillGroup(fields: PartialWorkoutFields): PillGroup {
  const pills: Pill[] = FIELD_PILL_CONFIG.filter(
    (config) => fields[config.key] != null,
  ).map((config) => ({
    id: crypto.randomUUID(),
    kind: "pill",
    fieldType: config.fieldType,
    value: fields[config.key]!,
    label: config.label(fields[config.key]!),
  }));

  return {
    id: crypto.randomUUID(),
    kind: "group",
    fields,
    pills,
    createdAt: Date.now(),
  };
}

// Module-level ref containers — avoids React Compiler "refs during render" errors
let latestWeekContext: WeekContext | null = null;
let pendingActions: string[] = [];
let pendingEditedPlanWeeks: string | null = null;
const evictedWorkoutIds = new Set<string>();

/** Mark a workout as evicted — filtered from context until the server catches up. */
function evictWorkoutFromContext(workoutId: string) {
  evictedWorkoutIds.add(workoutId);
}

/** Apply eviction filter and sync context. */
function syncWeekContext(weekContext: WeekContext) {
  for (const id of evictedWorkoutIds) {
    if (!weekContext.existingWorkouts.some((w) => w.id === id)) {
      evictedWorkoutIds.delete(id);
    }
  }

  latestWeekContext =
    evictedWorkoutIds.size > 0
      ? {
          ...weekContext,
          existingWorkouts: weekContext.existingWorkouts.filter(
            (w) => !evictedWorkoutIds.has(w.id),
          ),
        }
      : weekContext;
}

const transport = new DefaultChatTransport({
  api: "/api/ai/chat",
  body: () => {
    const recentActions =
      pendingActions.length > 0 ? [...pendingActions] : undefined;
    pendingActions = [];
    const editedPlanWeeks = pendingEditedPlanWeeks;
    pendingEditedPlanWeeks = null;
    return { weekContext: latestWeekContext, recentActions, editedPlanWeeks };
  },
});

export function useAIChat({
  weekContext,
  onWorkoutCreated,
  onWorkoutDeleted,
  onPlanApplied,
  addExistingPill,
  addGroup,
  removePlaygroundItem,
  undoWorkout,
  undoPlan,
}: UseAIChatOptions) {
  // Sync latest weekContext to module-level variable via effect (not during render)
  useEffect(() => {
    syncWeekContext(weekContext);
  });

  // Track which tool results we've already processed to avoid duplicate side effects
  const processedToolCalls = useRef(new Set<string>());

  // Map toolCallId → created item info for undo support
  const undoMap = useRef(new Map<string, UndoEntry>());

  // Links the generateTrainingPlan toolCallId to the subsequent applyPlanToSchedule result
  const pendingPlanToolCallId = useRef<string | null>(null);

  const [appliedPlanIds, setAppliedPlanIds] = useState<Set<string>>(new Set());

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport,
    onFinish: ({ message }) => {
      processToolResults(message);
    },
  });

  function processToolResults(message: UIMessage) {
    for (const part of message.parts) {
      const toolPart = asResolvedToolPart(part);
      if (!toolPart) continue;
      if (toolPart.state !== "output-available") continue;
      if (processedToolCalls.current.has(toolPart.toolCallId)) continue;
      processedToolCalls.current.add(toolPart.toolCallId);

      // Tool name is encoded in the part type: "tool-createWorkout" → "createWorkout"
      const toolName = part.type.slice(5);

      switch (toolName) {
        case "createWorkout": {
          const workout = toolPart.output?.workout as
            | {
                id: string;
                dayOfWeek?: string;
                sport?: string;
                workoutType?: string;
                distance?: number;
              }
            | undefined;
          if (workout?.id) {
            const label = [
              workout.dayOfWeek,
              workout.sport,
              workout.workoutType,
              workout.distance ? `${workout.distance}km` : "",
            ]
              .filter(Boolean)
              .join(" ");
            undoMap.current.set(toolPart.toolCallId, {
              type: "workout",
              id: workout.id,
              label,
            });
          }
          onWorkoutCreated();
          break;
        }

        case "createPill": {
          if (!toolPart.output?.pill) break;
          const pillData = toolPart.output.pill as {
            fieldType: PillFieldType;
            value: string | number;
            label: string;
          };
          const pill: Pill = {
            id: crypto.randomUUID(),
            kind: "pill",
            fieldType: pillData.fieldType,
            value: pillData.value,
            label: pillData.label,
          };
          addExistingPill(pill);
          undoMap.current.set(toolPart.toolCallId, {
            type: "playground",
            id: pill.id,
          });
          break;
        }

        case "createPlaygroundWorkout": {
          if (!toolPart.output?.fields) break;
          const fields = toolPart.output.fields as PartialWorkoutFields;
          const group = buildPillGroup(fields);
          addGroup(group);
          undoMap.current.set(toolPart.toolCallId, {
            type: "playground",
            id: group.id,
          });
          break;
        }

        case "removeWorkout":
          onWorkoutDeleted();
          break;

        case "applyPlanToSchedule": {
          const appliedIds = toolPart.output?.workoutIds as
            | string[]
            | undefined;
          const originToolCallId = pendingPlanToolCallId.current;
          if (appliedIds?.length && originToolCallId) {
            // Store under the generateTrainingPlan toolCallId so the card can trigger undo
            undoMap.current.set(originToolCallId, {
              type: "plan",
              workoutIds: appliedIds,
            });
            pendingPlanToolCallId.current = null;
            setAppliedPlanIds((prev) => new Set(prev).add(originToolCallId));
          }
          onPlanApplied();
          break;
        }
      }
    }
  }

  async function undoToolAction(toolCallId: string): Promise<boolean> {
    const entry = undoMap.current.get(toolCallId);
    if (!entry) return false;

    switch (entry.type) {
      case "workout":
        await undoWorkout(entry.id);
        evictWorkoutFromContext(entry.id);
        onWorkoutDeleted();
        notifySilently(`User removed the ${entry.label} workout`);
        break;
      case "playground":
        removePlaygroundItem(entry.id);
        notifySilently(`User undid the last created playground item`);
        break;
      case "plan":
        await undoPlan(entry.workoutIds);
        for (const workoutId of entry.workoutIds) {
          evictWorkoutFromContext(workoutId);
        }
        onWorkoutDeleted();
        notifySilently(
          `User undid the applied training plan (${entry.workoutIds.length} workouts removed)`,
        );
        break;
    }

    undoMap.current.delete(toolCallId);
    return true;
  }

  /** Queue a context note — included in the next LLM request body, not in chat. */
  function notifySilently(text: string) {
    pendingActions.push(text);
  }

  function handleApplyPlan(
    editedPlan?: TrainingPlan,
    generateToolCallId?: string,
  ) {
    if (generateToolCallId) {
      pendingPlanToolCallId.current = generateToolCallId;
    }
    if (editedPlan) {
      pendingEditedPlanWeeks = JSON.stringify(editedPlan.weeks);
    }
    const weekCount = editedPlan?.weeks.length ?? 1;
    const weekRange = editedPlan
      ? editedPlan.weeks
          .map((w) =>
            formatDateDisplay(new Date(w.weekStartDate + "T00:00:00")),
          )
          .join(" → ")
      : "";
    sendMessage({
      text: `Apply the training plan to my schedule — ${weekCount} week${weekCount > 1 ? "s" : ""} starting ${weekRange}`,
    });
  }

  return {
    messages,
    status,
    sendMessage,
    setMessages,
    error,
    handleApplyPlan,
    undoToolAction,
    notifySilently,
    evictWorkout: evictWorkoutFromContext,
    appliedPlanIds,
  };
}
