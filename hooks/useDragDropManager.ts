import { useState, useCallback } from "react";
import { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
  DayOfWeek,
  Workout,
  Sport,
  WorkoutType,
  HeartRateZone,
} from "@/types/workout";
import { Pill, PartialWorkoutFields } from "@/types/playground";
import { toast } from "sonner";
import {
  createWorkoutAction,
  updateWorkoutDayAction,
  deleteWorkoutAction,
} from "@/app/actions/workout";

interface UseDragDropManagerProps {
  workouts: Workout[] | null;
  weekStartDateISO: string;
  removePill: (id: string) => void;
  resolvePillToFields: (pill: Pill) => PartialWorkoutFields;
  getWorkoutDefaults: (fields: PartialWorkoutFields) => {
    sport: Sport;
    workoutType: WorkoutType;
    heartRateZone: HeartRateZone;
    distance?: number;
    pace?: string;
  };
  refreshWorkouts: () => void;
}

export function useDragDropManager({
  workouts,
  weekStartDateISO,
  removePill,
  resolvePillToFields,
  getWorkoutDefaults,
  refreshWorkouts,
}: UseDragDropManagerProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Map<string, DayOfWeek>>(
    new Map(),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveDragType(event.active.data.current?.type ?? "workout");
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveDragType(null);

      if (!over) return;

      const sourceType = active.data.current?.type as string;
      const targetType = over.data.current?.type as string;

      if (sourceType === "pill" && targetType === "trash") {
        const pill = active.data.current?.pill as Pill;
        removePill(pill.id);
        return;
      }

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
    },
    [
      workouts,
      weekStartDateISO,
      removePill,
      resolvePillToFields,
      getWorkoutDefaults,
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
    pendingChanges,
    handleDragStart,
    handleDragEnd,
    savePendingChanges,
    cancelPendingChanges,
    getDisplayWorkouts,
  };
}
