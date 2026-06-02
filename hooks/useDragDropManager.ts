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
import { withToastError } from "@/lib/utils/errorClient";
import { arrayMove } from "@dnd-kit/sortable";
import {
  createWorkoutAction,
  updateWorkoutDayAction,
  updateWorkoutFieldAction,
  deleteWorkoutAction,
  reorderWorkoutsAction,
} from "@/app/actions/workout";
import { PartialWorkoutUpdate } from "@/types/workoutValidation";

interface UseDragDropManagerProps {
  workouts: Workout[] | null;
  weekStartDateISO: string;
  onDeleteActivity?: (activityId: string) => Promise<void>;
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
  remainingSlots: number;
  removePreset: (id: string) => void;
  restorePreset: (preset: Preset) => void;
  refreshWorkouts: () => void;
}

//Decompose a workout into individual pills.
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

/** Build a workout creation payload from defaults or existing workout fields. */
function buildWorkoutPayload(fields: {
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance?: number;
  pace?: string;
  duration?: number;
}) {
  return {
    sport: fields.sport,
    workoutType: fields.workoutType,
    heartRateZone: fields.heartRateZone,
    distance: fields.distance ?? 0,
    pace: fields.pace,
    duration:
      fields.duration ??
      (fields.distance && fields.pace
        ? calculateDuration(fields.distance, fields.pace)
        : undefined),
  };
}

export function useDragDropManager({
  workouts,
  weekStartDateISO,
  onDeleteActivity,
  addPill,
  addExistingPill,
  addGroup,
  updateGroup,
  removeItem,
  resolvePillToFields,
  getWorkoutDefaults,
  remainingSlots,
  removePreset,
  restorePreset,
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

      if (sourceType === "pill" && targetType === "trash") {
        const pill = active.data.current?.pill as Pill;
        removeItem(pill.id);
        return;
      }

      // ── pill → day (create workout) ──
      if (sourceType === "pill" && targetType === "day") {
        const pill = active.data.current?.pill as Pill;
        const day = over.data.current?.day as DayOfWeek;
        const fields = resolvePillToFields(pill);
        const defaults = getWorkoutDefaults(fields);

        const result = await withToastError(
          () =>
            createWorkoutAction(
              buildWorkoutPayload(defaults),
              day,
              weekStartDateISO,
            ),
          "Failed to create workout",
        );
        if (!result) return;
        removeItem(pill.id);
        refreshWorkouts();
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

        const updateFields: PartialWorkoutUpdate = { ...fields };
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

        const updateResult = await withToastError(
          () => updateWorkoutFieldAction(targetWorkoutId, updateFields),
          "Failed to update workout",
        );
        if (!updateResult) return;
        removeItem(pill.id);
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
                const undoFields: PartialWorkoutUpdate = {
                  [fieldKey]: oldValue,
                };
                if (updateFields.duration !== undefined) {
                  undoFields.duration = workout.duration;
                }
                const undoResult = await withToastError(
                  () => updateWorkoutFieldAction(targetWorkoutId, undoFields),
                  "Failed to undo",
                );
                if (!undoResult) return;
                addPill(pill.fieldType, pill.value, pill.label);
                refreshWorkouts();
              },
            },
            duration: 5000,
          });
        }
        return;
      }

      // ── pill → pill-target (merge two pills into a group) ──
      if (sourceType === "pill" && targetType === "pill-target") {
        const draggedPill = active.data.current?.pill as Pill;
        const targetPill = over.data.current?.pill as Pill;

        // Don't merge pills with the same field type
        if (draggedPill.fieldType === targetPill.fieldType) {
          if (draggedPill.fieldType === "sport") {
            toast.warning(
              `Cannot merge "${getSportLabel(draggedPill.value as Sport)}" with "${getSportLabel(targetPill.value as Sport)}"`,
            );
          } else {
            toast.warning("Cannot merge two pills of the same type");
          }
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

        // Warn when merging a different sport into a group
        // Groups without an explicit sport default to "running" since workout
        // type labels are running-centric (e.g. "Easy Run", "Long Run")
        const groupSport = group.fields.sport ?? "running";
        if (
          pill.fieldType === "sport" &&
          (pill.value as Sport) !== groupSport
        ) {
          toast.warning(
            `Cannot merge "${getSportLabel(pill.value as Sport)}" into a "${getSportLabel(groupSport)}" group`,
          );
          return;
        }

        // Check sport ↔ workoutType compatibility with existing group fields
        const incomingSport =
          pill.fieldType === "sport"
            ? (pill.value as Sport)
            : group.fields.sport;
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

      // ── group → group-card (merge groups if sports don't conflict) ──
      if (sourceType === "group" && targetType === "group-card") {
        const draggedGroup = active.data.current?.group as PillGroup;
        const targetGroup = over.data.current?.group as PillGroup;

        // Dropped on itself — no-op
        if (draggedGroup.id === targetGroup.id) return;

        const draggedSport = draggedGroup.fields.sport ?? "running";
        const targetSport = targetGroup.fields.sport ?? "running";

        if (draggedSport !== targetSport) {
          toast.warning(
            `Cannot merge a "${getSportLabel(draggedSport)}" group into a "${getSportLabel(targetSport)}" group`,
          );
          return;
        }

        const mergedFields: PartialWorkoutFields = {
          ...targetGroup.fields,
          ...draggedGroup.fields,
        };

        removeItem(draggedGroup.id);
        updateGroup(targetGroup.id, {
          fields: mergedFields,
          pills: [...targetGroup.pills, ...draggedGroup.pills],
        });
        return;
      }

      if (sourceType === "group" && targetType === "trash") {
        const group = active.data.current?.group as PillGroup;
        removeItem(group.id);
        toast.success("Group deleted", {
          description: "You can undo this action",
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

        const groupResult = await withToastError(
          () =>
            createWorkoutAction(
              buildWorkoutPayload(defaults),
              day,
              weekStartDateISO,
            ),
          "Failed to create workout",
        );
        if (!groupResult) return;
        removeItem(group.id);
        refreshWorkouts();
        return;
      }

      // ── group → workout-card (merge group fields into workout) ──
      if (sourceType === "group" && targetType === "workout-card") {
        const group = active.data.current?.group as PillGroup;
        const targetWorkoutId = over.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === targetWorkoutId);

        if (!workout) return;

        const updateFields: PartialWorkoutUpdate = { ...group.fields };

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

        const mergeResult = await withToastError(
          () => updateWorkoutFieldAction(targetWorkoutId, updateFields),
          "Failed to update workout",
        );
        if (!mergeResult) return;
        removeItem(group.id);
        refreshWorkouts();
        return;
      }

      // ── workout → playground (decompose into pills, move) ──
      if (sourceType === "workout" && targetType === "playground") {
        const workoutId = active.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === workoutId);

        if (!workout) return;

        const decomposedPills = workoutToPills(workout);

        // Guard: block decompose if pills would exceed capacity
        if (decomposedPills.length > remainingSlots) {
          const shortage = decomposedPills.length - remainingSlots;
          toast.warning(
            `Not enough room — clear ${shortage} item${shortage !== 1 ? "s" : ""} first`,
            {
              description: `Decomposing this workout creates ${decomposedPills.length} pills`,
            },
          );
          return;
        }

        // Clear any pending day changes for this workout
        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(workoutId);
          return next;
        });

        const decomposeResult = await withToastError(async () => {
          await deleteWorkoutAction(workoutId);
          return true as const;
        }, "Failed to decompose workout");
        if (!decomposeResult) return;
        for (const pill of decomposedPills) {
          addExistingPill(pill);
        }
        refreshWorkouts();

        toast.success("Workout decomposed into pills", {
          action: {
            label: "Undo",
            onClick: async () => {
              const undoResult = await withToastError(
                () =>
                  createWorkoutAction(
                    buildWorkoutPayload(workout),
                    workout.dayOfWeek,
                    weekStartDateISO,
                  ),
                "Failed to undo",
              );
              if (!undoResult) return;
              for (const pill of decomposedPills) {
                removeItem(pill.id);
              }
              refreshWorkouts();
            },
          },
          duration: 5000,
        });
        return;
      }

      if (sourceType === "workout" && targetType === "trash") {
        const workoutId = active.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === workoutId);

        setPendingChanges((prev) => {
          const next = new Map(prev);
          next.delete(workoutId);
          return next;
        });

        const deleteResult = await withToastError(async () => {
          await deleteWorkoutAction(workoutId);
          return true as const;
        }, "Failed to delete workout");
        if (!deleteResult) return;
        refreshWorkouts();

        toast.success(
          `"${workout?.title || workout?.workoutType || "Workout"}" deleted`,
          {
            description: "You can undo this action",
            action: {
              label: "Undo",
              onClick: async () => {
                if (!workout) return;
                const undoResult = await withToastError(
                  () =>
                    createWorkoutAction(
                      buildWorkoutPayload(workout),
                      workout.dayOfWeek,
                      weekStartDateISO,
                    ),
                  "Failed to undo deletion",
                );
                if (!undoResult) return;
                refreshWorkouts();
              },
            },
            duration: 5000,
          },
        );
        return;
      }

      // ── activity → trash (delete standalone Strava activity) ──
      if (sourceType === "activity" && targetType === "trash") {
        const activityId = active.data.current?.activityId as string;
        if (!onDeleteActivity) return;

        const deleteResult = await withToastError(async () => {
          await onDeleteActivity(activityId);
          return true as const;
        }, "Failed to delete activity");
        if (!deleteResult) return;
        refreshWorkouts();

        toast.success("Activity deleted", {
          description: "Re-sync to restore it",
        });
        return;
      }

      // ── workout → workout (same-day reorder via sortable) ──
      if (sourceType === "workout" && targetType === "workout") {
        const activeWorkoutId = active.data.current?.workoutId as string;
        const overWorkoutId = over.data.current?.workoutId as string;
        if (activeWorkoutId === overWorkoutId) return;

        const activeWorkout = workouts?.find((w) => w.id === activeWorkoutId);
        const overWorkout = workouts?.find((w) => w.id === overWorkoutId);
        if (!activeWorkout || !overWorkout) return;

        // Only reorder within same day
        if (activeWorkout.dayOfWeek !== overWorkout.dayOfWeek) return;

        const dayWorkouts = (workouts ?? [])
          .filter((w) => w.dayOfWeek === activeWorkout.dayOfWeek)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const oldIndex = dayWorkouts.findIndex((w) => w.id === activeWorkoutId);
        const newIndex = dayWorkouts.findIndex((w) => w.id === overWorkoutId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

        const reordered = arrayMove(dayWorkouts, oldIndex, newIndex);
        const orderedIds = reordered.map((w) => w.id);

        await withToastError(
          () => reorderWorkoutsAction(orderedIds),
          "Failed to reorder workouts",
        );
        refreshWorkouts();
        return;
      }

      // ── workout → day (move to different day or drop on insertion slot) ──
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

        const presetResult = await withToastError(
          () =>
            createWorkoutAction(
              buildWorkoutPayload(defaults),
              day,
              weekStartDateISO,
            ),
          "Failed to create workout from preset",
        );
        if (!presetResult) return;
        refreshWorkouts();
        return;
      }

      // ── preset → workout-card (merge preset fields into workout) ──
      if (sourceType === "preset" && targetType === "workout-card") {
        const preset = active.data.current?.preset as Preset;
        const targetWorkoutId = over.data.current?.workoutId as string;
        const workout = workouts?.find((w) => w.id === targetWorkoutId);

        if (!workout) return;

        const updateFields: PartialWorkoutUpdate = { ...preset.fields };

        const finalDistance = (preset.fields.distance ?? workout.distance) as
          | number
          | undefined;
        const finalPace = (preset.fields.pace ?? workout.pace) as
          | string
          | undefined;
        if (finalDistance && finalPace) {
          updateFields.duration = calculateDuration(finalDistance, finalPace);
        }

        const applyResult = await withToastError(
          () => updateWorkoutFieldAction(targetWorkoutId, updateFields),
          "Failed to apply preset to workout",
        );
        if (!applyResult) return;
        refreshWorkouts();
        return;
      }

      if (sourceType === "preset" && targetType === "trash") {
        const preset = active.data.current?.preset as Preset;
        removePreset(preset.id);
        toast.success(`Preset "${preset.label}" deleted`, {
          description: "You can undo this action",
          action: {
            label: "Undo",
            onClick: () => restorePreset(preset),
          },
          duration: 5000,
        });
        return;
      }
    },
    [
      workouts,
      weekStartDateISO,
      onDeleteActivity,
      addPill,
      addExistingPill,
      addGroup,
      updateGroup,
      removeItem,
      resolvePillToFields,
      getWorkoutDefaults,
      remainingSlots,
      removePreset,
      restorePreset,
      refreshWorkouts,
    ],
  );

  const savePendingChanges = useCallback(async () => {
    const entries = Array.from(pendingChanges.entries());
    const results = await withToastError(
      () =>
        Promise.all(
          entries.map(([workoutId, newDay]) =>
            updateWorkoutDayAction(workoutId, newDay),
          ),
        ),
      `Failed to save ${entries.length} pending changes`,
    );
    if (!results) return;
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
