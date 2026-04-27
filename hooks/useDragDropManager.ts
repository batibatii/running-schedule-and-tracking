import { useState, useCallback } from "react";
import { DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import {
  DayOfWeek,
  Workout,
  Sport,
  WorkoutType,
  HeartRateZone,
} from "@/types/workout";
import {
  Pill,
  PillGroup,
  Preset,
  PillFieldType,
  PartialWorkoutFields,
  DragItemType,
} from "@/types/playground";
import { calculateDuration } from "@/lib/utils/pace";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  isCompatibleWorkoutType,
} from "@/lib/utils/workoutLabels";
import { toast } from "sonner";
import {
  createWorkoutAction,
  updateWorkoutDayAction,
  updateWorkoutFieldAction,
  deleteWorkoutAction,
} from "@/app/actions/workout";

interface UseDragDropManagerProps {
  workouts: Workout[] | null;
  weekStartDateISO: string;
  removePill: (id: string) => void;
  addPill: (
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) => void;
  addExistingPill: (pill: Pill) => void;
  addGroup: (group: PillGroup) => void;
  updateGroup: (id: string, updates: Partial<PillGroup>) => void;
  removeItem: (id: string) => void;
  resolvePillToFields: (pill: Pill) => PartialWorkoutFields;
  getWorkoutDefaults: (fields: PartialWorkoutFields) => {
    sport: Sport;
    workoutType: WorkoutType;
    heartRateZone: HeartRateZone;
    distance?: number;
    pace?: string;
  };
  removePreset: (id: string) => void;
  refreshWorkouts: () => void;
}

/**
 * Decompose a workout into individual pills.
 */
function workoutToPills(workout: Workout): Pill[] {
  const pills: Pill[] = [];

  pills.push({
    id: crypto.randomUUID(),
    kind: "pill",
    fieldType: "sport",
    value: workout.sport,
    label: getSportLabel(workout.sport),
  });

  pills.push({
    id: crypto.randomUUID(),
    kind: "pill",
    fieldType: "workoutType",
    value: workout.workoutType,
    label: getWorkoutTypeLabel(workout.workoutType),
  });

  pills.push({
    id: crypto.randomUUID(),
    kind: "pill",
    fieldType: "heartRateZone",
    value: workout.heartRateZone,
    label: getZoneLabel(workout.heartRateZone),
  });

  if (workout.distance) {
    pills.push({
      id: crypto.randomUUID(),
      kind: "pill",
      fieldType: "distance",
      value: workout.distance,
      label: `${workout.distance} km`,
    });
  }

  if (workout.pace) {
    pills.push({
      id: crypto.randomUUID(),
      kind: "pill",
      fieldType: "pace",
      value: workout.pace,
      label: `${workout.pace} /km`,
    });
  }

  return pills;
}

export function useDragDropManager({
  workouts,
  weekStartDateISO,
  removePill,
  addPill,
  addExistingPill,
  addGroup,
  updateGroup,
  removeItem,
  resolvePillToFields,
  getWorkoutDefaults,
  removePreset,
  refreshWorkouts,
}: UseDragDropManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<DragItemType | null>(
    null,
  );
  const [isOverTrash, setIsOverTrash] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Map<string, DayOfWeek>>(
    new Map(),
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setIsOverTrash(event.over?.data.current?.type === "trash");
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDragType(event.active.data.current?.type ?? "workout");
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveDragType(null);
      setIsOverTrash(false);

      if (!over) return;

      const sourceType = active.data.current?.type as string;
      const targetType = over.data.current?.type as string;

      // ── pill → trash ──
      if (sourceType === "pill" && targetType === "trash") {
        const pill = active.data.current?.pill as Pill;
        removePill(pill.id);
        return;
      }

      // ── pill → day (create workout) ──
      if (sourceType === "pill" && targetType === "day") {
        const pill = active.data.current?.pill as Pill;
        const day = over.data.current?.day as DayOfWeek;
        const fields = resolvePillToFields(pill);
        const defaults = getWorkoutDefaults(fields);

        try {
          await createWorkoutAction(
            {
              sport: defaults.sport,
              workoutType: defaults.workoutType,
              heartRateZone: defaults.heartRateZone,
              distance: defaults.distance ?? 0,
              pace: defaults.pace,
            },
            day,
            weekStartDateISO,
          );
          removePill(pill.id);
          refreshWorkouts();
        } catch {
          toast.error("Failed to create workout");
        }
        return;
      }

      // ── pill → workout-card (merge field into workout) ──
      if (sourceType === "pill" && targetType === "workout-card") {
        const pill = active.data.current?.pill as Pill;
        const targetWorkoutId = over.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === targetWorkoutId);

        if (!workout) return;

        const fields = resolvePillToFields(pill);
        const fieldKey = Object.keys(fields)[0] as keyof typeof fields;
        const oldValue = workout[fieldKey];
        const newValue = fields[fieldKey];

        const updateFields = { ...fields } as Record<string, unknown>;
        if (fieldKey === "pace" && workout.distance) {
          updateFields.duration = calculateDuration(
            workout.distance,
            fields.pace!,
          );
        } else if (fieldKey === "distance" && workout.pace) {
          updateFields.duration = calculateDuration(
            fields.distance!,
            workout.pace,
          );
        }

        try {
          await updateWorkoutFieldAction(targetWorkoutId, updateFields);
          removePill(pill.id);
          refreshWorkouts();

          if (
            oldValue !== undefined &&
            oldValue !== null &&
            oldValue !== newValue
          ) {
            toast.success(`Updated ${fieldKey} to "${newValue}"`, {
              action: {
                label: "Undo",
                onClick: async () => {
                  try {
                    const undoFields: Record<string, unknown> = {
                      [fieldKey]: oldValue,
                    };
                    if (updateFields.duration !== undefined) {
                      undoFields.duration = workout.duration;
                    }
                    await updateWorkoutFieldAction(targetWorkoutId, undoFields);
                    addPill(pill.fieldType, pill.value, pill.label);
                    refreshWorkouts();
                  } catch {
                    toast.error("Failed to undo");
                  }
                },
              },
              duration: 5000,
            });
          }
        } catch {
          toast.error("Failed to update workout");
        }
        return;
      }

      // ── pill → pill-target (merge two pills into a group) ──
      if (sourceType === "pill" && targetType === "pill-target") {
        const draggedPill = active.data.current?.pill as Pill;
        const targetPill = over.data.current?.pill as Pill;

        // Don't merge pills with the same field type
        if (draggedPill.fieldType === targetPill.fieldType) {
          toast.warning("Cannot merge two pills of the same type");
          return;
        }

        // Check sport ↔ workoutType compatibility
        const sportPill = [draggedPill, targetPill].find(
          (pill) => pill.fieldType === "sport",
        );
        const workoutTypePill = [draggedPill, targetPill].find(
          (pill) => pill.fieldType === "workoutType",
        );
        if (
          sportPill &&
          workoutTypePill &&
          !isCompatibleWorkoutType(
            sportPill.value as Sport,
            workoutTypePill.value as WorkoutType,
          )
        ) {
          toast.warning(
            `"${workoutTypePill.label}" is not compatible with "${sportPill.label}"`,
          );
          return;
        }

        const fieldsA = resolvePillToFields(draggedPill);
        const fieldsB = resolvePillToFields(targetPill);
        // Target pill's field takes priority (it was there first),
        // dragged pill overwrites on conflict
        const mergedFields: PartialWorkoutFields = {
          ...fieldsB,
          ...fieldsA,
        };

        const group: PillGroup = {
          id: crypto.randomUUID(),
          kind: "group",
          fields: mergedFields,
          pills: [targetPill, draggedPill],
          createdAt: Date.now(),
        };

        removeItem(draggedPill.id);
        removeItem(targetPill.id);
        addGroup(group);
        return;
      }

      // ── pill → group-card (add pill to existing group) ──
      if (sourceType === "pill" && targetType === "group-card") {
        const pill = active.data.current?.pill as Pill;
        const group = over.data.current?.group as PillGroup;

        // Check sport ↔ workoutType compatibility with existing group fields
        const incomingSport =
          pill.fieldType === "sport" ? (pill.value as Sport) : group.fields.sport;
        const incomingWorkoutType =
          pill.fieldType === "workoutType"
            ? (pill.value as WorkoutType)
            : group.fields.workoutType;
        if (
          incomingSport &&
          incomingWorkoutType &&
          !isCompatibleWorkoutType(incomingSport, incomingWorkoutType)
        ) {
          toast.warning(
            `"${getWorkoutTypeLabel(incomingWorkoutType)}" is not compatible with "${getSportLabel(incomingSport)}"`,
          );
          return;
        }

        const pillFields = resolvePillToFields(pill);
        const mergedFields: PartialWorkoutFields = {
          ...group.fields,
          ...pillFields,
        };

        removeItem(pill.id);
        updateGroup(group.id, {
          fields: mergedFields,
          pills: [...group.pills, pill],
        });
        return;
      }

      // ── group → trash ──
      if (sourceType === "group" && targetType === "trash") {
        const group = active.data.current?.group as PillGroup;
        removeItem(group.id);
        toast.success("Group deleted", {
          action: {
            label: "Undo",
            onClick: () => addGroup(group),
          },
          duration: 5000,
        });
        return;
      }

      // ── group → day (create workout from group) ──
      if (sourceType === "group" && targetType === "day") {
        const group = active.data.current?.group as PillGroup;
        const day = over.data.current?.day as DayOfWeek;
        const defaults = getWorkoutDefaults(group.fields);

        try {
          const workoutData: Record<string, unknown> = {
            sport: defaults.sport,
            workoutType: defaults.workoutType,
            heartRateZone: defaults.heartRateZone,
            distance: defaults.distance ?? 0,
            pace: defaults.pace,
          };

          if (defaults.distance && defaults.pace) {
            workoutData.duration = calculateDuration(
              defaults.distance,
              defaults.pace,
            );
          }

          await createWorkoutAction(
            workoutData as Parameters<typeof createWorkoutAction>[0],
            day,
            weekStartDateISO,
          );
          removeItem(group.id);
          refreshWorkouts();
        } catch {
          toast.error("Failed to create workout");
        }
        return;
      }

      // ── group → workout-card (merge group fields into workout) ──
      if (sourceType === "group" && targetType === "workout-card") {
        const group = active.data.current?.group as PillGroup;
        const targetWorkoutId = over.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === targetWorkoutId);

        if (!workout) return;

        const updateFields = { ...group.fields } as Record<string, unknown>;

        // Recalculate duration if both distance and pace will be present
        const finalDistance = (group.fields.distance ?? workout.distance) as
          | number
          | undefined;
        const finalPace = (group.fields.pace ?? workout.pace) as
          | string
          | undefined;
        if (finalDistance && finalPace) {
          updateFields.duration = calculateDuration(finalDistance, finalPace);
        }

        try {
          await updateWorkoutFieldAction(targetWorkoutId, updateFields);
          removeItem(group.id);
          refreshWorkouts();
        } catch {
          toast.error("Failed to update workout");
        }
        return;
      }

      // ── workout → playground (decompose into pills, move) ──
      if (sourceType === "workout" && targetType === "playground") {
        const workoutId = active.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === workoutId);

        if (!workout) return;

        // Clear any pending day changes for this workout
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(workoutId);
          return next;
        });

        const decomposedPills = workoutToPills(workout);

        try {
          await deleteWorkoutAction(workoutId);
          for (const pill of decomposedPills) {
            addExistingPill(pill);
          }
          refreshWorkouts();

          toast.success("Workout decomposed into pills", {
            action: {
              label: "Undo",
              onClick: async () => {
                try {
                  await createWorkoutAction(
                    {
                      sport: workout.sport,
                      workoutType: workout.workoutType,
                      heartRateZone: workout.heartRateZone,
                      distance: workout.distance ?? 0,
                      duration: workout.duration,
                      pace: workout.pace,
                    },
                    workout.dayOfWeek,
                    weekStartDateISO,
                  );
                  // Remove the decomposed pills
                  for (const pill of decomposedPills) {
                    removeItem(pill.id);
                  }
                  refreshWorkouts();
                } catch {
                  toast.error("Failed to undo");
                }
              },
            },
            duration: 5000,
          });
        } catch {
          toast.error("Failed to decompose workout");
        }
        return;
      }

      // ── workout → trash ──
      if (sourceType === "workout" && targetType === "trash") {
        const workoutId = active.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === workoutId);

        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(workoutId);
          return next;
        });

        try {
          await deleteWorkoutAction(workoutId);
          refreshWorkouts();

          toast.success(
            `"${workout?.title || workout?.workoutType || "Workout"}" deleted`,
            {
              action: {
                label: "Undo",
                onClick: async () => {
                  if (!workout) return;
                  try {
                    await createWorkoutAction(
                      {
                        sport: workout.sport,
                        workoutType: workout.workoutType,
                        heartRateZone: workout.heartRateZone,
                        distance: workout.distance ?? 0,
                        duration: workout.duration,
                        pace: workout.pace,
                      },
                      workout.dayOfWeek,
                      weekStartDateISO,
                    );
                    refreshWorkouts();
                  } catch {
                    toast.error("Failed to undo deletion");
                  }
                },
              },
              duration: 5000,
            },
          );
        } catch {
          toast.error("Failed to delete workout");
        }
        return;
      }

      // ── workout → day (move to different day) ──
      if (sourceType === "workout" && targetType === "day") {
        const workoutId = active.data.current?.workoutId as string;
        const newDay = over.data.current?.day as DayOfWeek;
        const workout = workouts?.find((w) => w.id === workoutId);

        if (!workout) return;

        if (workout.dayOfWeek === newDay) {
          setPendingChanges((prev) => {
            const next = new Map(prev);
            next.delete(workoutId);
            return next;
          });
          return;
        }

        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.set(workoutId, newDay);
          return next;
        });
        return;
      }

      // ── preset → day (create workout from preset) ──
      if (sourceType === "preset" && targetType === "day") {
        const preset = active.data.current?.preset as Preset;
        const day = over.data.current?.day as DayOfWeek;
        const defaults = getWorkoutDefaults(preset.fields);

        try {
          const workoutData: Record<string, unknown> = {
            sport: defaults.sport,
            workoutType: defaults.workoutType,
            heartRateZone: defaults.heartRateZone,
            distance: defaults.distance ?? 0,
            pace: defaults.pace,
          };

          if (defaults.distance && defaults.pace) {
            workoutData.duration = calculateDuration(
              defaults.distance,
              defaults.pace,
            );
          }

          await createWorkoutAction(
            workoutData as Parameters<typeof createWorkoutAction>[0],
            day,
            weekStartDateISO,
          );
          refreshWorkouts();
        } catch {
          toast.error("Failed to create workout from preset");
        }
        return;
      }

      // ── preset → workout-card (merge preset fields into workout) ──
      if (sourceType === "preset" && targetType === "workout-card") {
        const preset = active.data.current?.preset as Preset;
        const targetWorkoutId = over.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === targetWorkoutId);

        if (!workout) return;

        const updateFields = { ...preset.fields } as Record<string, unknown>;

        const finalDistance = (preset.fields.distance ?? workout.distance) as
          | number
          | undefined;
        const finalPace = (preset.fields.pace ?? workout.pace) as
          | string
          | undefined;
        if (finalDistance && finalPace) {
          updateFields.duration = calculateDuration(finalDistance, finalPace);
        }

        try {
          await updateWorkoutFieldAction(targetWorkoutId, updateFields);
          refreshWorkouts();
        } catch {
          toast.error("Failed to apply preset to workout");
        }
        return;
      }

      // ── preset → trash (delete preset) ──
      if (sourceType === "preset" && targetType === "trash") {
        const preset = active.data.current?.preset as Preset;
        removePreset(preset.id);
        toast.success(`Preset "${preset.label}" deleted`);
        return;
      }
    },
    [
      workouts,
      weekStartDateISO,
      removePill,
      addPill,
      addExistingPill,
      addGroup,
      updateGroup,
      removeItem,
      resolvePillToFields,
      getWorkoutDefaults,
      removePreset,
      refreshWorkouts,
    ],
  );

  const savePendingChanges = useCallback(async () => {
    const promises = Array.from(pendingChanges.entries()).map(
      ([workoutId, newDay]) => updateWorkoutDayAction(workoutId, newDay),
    );
    await Promise.all(promises);
    setPendingChanges(new Map());
    refreshWorkouts();
  }, [pendingChanges, refreshWorkouts]);

  const cancelPendingChanges = useCallback(() => {
    setPendingChanges(new Map());
  }, []);

  const getDisplayWorkouts = useCallback(() => {
    if (!workouts) return [];

    return workouts.map((workout) => {
      const pendingDay = pendingChanges.get(workout.id);
      if (pendingDay) {
        return { ...workout, dayOfWeek: pendingDay };
      }
      return workout;
    });
  }, [workouts, pendingChanges]);

  return {
    activeId,
    activeDragType,
    isOverTrash,
    pendingChanges,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    savePendingChanges,
    cancelPendingChanges,
    getDisplayWorkouts,
  };
}
