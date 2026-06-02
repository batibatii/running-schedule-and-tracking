"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  getWeekStartDate,
  getWeekDates,
  formatDateDisplay,
  formatDateToISO,
  getDayName,
} from "@/lib/utils/date";
import { DayOfWeek, Workout } from "@/types/workout";
import type {
  ScheduleItem,
  ScheduleWorkout,
  StandaloneActivity,
} from "@/types/schedule";
import { AddWorkoutDialog } from "./AddWorkoutDialog";
import { WorkoutCard } from "./WorkoutCard";
import { ActivityDetailDialog } from "./ActivityDetailDialog";
import { StatsStrip } from "./StatsStrip";
import { SortableDay } from "./SortableDay";
import { SortableWorkoutCard } from "./SortableWorkoutCard";
import { DraggableActivityCard } from "./DraggableActivityCard";
import { PlaygroundArea } from "@/components/playground/PlaygroundArea";
import { PillChip } from "@/components/playground/PillChip";
import { PillGroupCard } from "@/components/playground/PillGroupCard";
import { PresetChip } from "@/components/playground/PresetChip";
import { TrashBin } from "@/components/playground/TrashBin";
import { usePresets } from "@/hooks/usePresets";
import { WorkoutFormData } from "@/types/workoutValidation";
import { useAsyncData } from "@/hooks/useAsyncData";
import { usePlayground } from "@/hooks/usePlayground";
import { useDragDropManager } from "@/hooks/useDragDropManager";
import {
  fetchScheduleItemsAction,
  createWorkoutAction,
  updateWorkoutAction,
  deleteWorkoutAction,
} from "@/app/actions/workout";
import { deleteActivityAction } from "@/app/actions/strava";
import { withToastError } from "@/lib/utils/errorClient";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";

const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

interface WeeklyScheduleProps {
  syncTrigger?: number;
}

export function WeeklySchedule({ syncTrigger }: WeeklyScheduleProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [viewingActivity, setViewingActivity] =
    useState<StandaloneActivity | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const { data: scheduleItems, execute: fetchItems } =
    useAsyncData<ScheduleItem[]>();

  const weekStartDate = getWeekStartDate(weekOffset);
  const weekDates = getWeekDates(weekStartDate);
  const weekStartDateISO = formatDateToISO(weekStartDate);

  const refreshWorkouts = () => {
    fetchItems(() => fetchScheduleItemsAction(weekStartDateISO));
  };

  useEffect(() => {
    refreshWorkouts();
  }, [weekStartDateISO]);

  // Re-fetch when sync completes (triggered from TopBar)
  const hasMountedSync = useRef(false);
  useEffect(() => {
    if (!hasMountedSync.current) {
      hasMountedSync.current = true;
      return;
    }
    refreshWorkouts();
  }, [syncTrigger]);

  // Split schedule items into planned workouts and standalone activities
  // ScheduleWorkout is a superset of Workout (+ `kind`), so destructure it out
  const plannedWorkouts: Workout[] = (scheduleItems ?? [])
    .filter((item): item is ScheduleWorkout => item.kind === "planned")
    .map(({ kind, ...rest }) => rest);

  const standaloneActivities: StandaloneActivity[] = (
    scheduleItems ?? []
  ).filter((item): item is StandaloneActivity => item.kind === "activity");

  const {
    items,
    pills,
    groups,
    remainingSlots,
    addPill,
    addExistingPill,
    addGroup,
    updateGroup,
    removeItem,
    resolvePillToFields,
    getWorkoutDefaults,
  } = usePlayground();

  const { presets, addPreset, removePreset, restorePreset } = usePresets();

  const {
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
  } = useDragDropManager({
    workouts: plannedWorkouts,
    weekStartDateISO,
    onDeleteActivity: deleteActivityAction,
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
  });

  const handleOpenDialog = (day: DayOfWeek, workout?: Workout) => {
    setSelectedDay(day);
    setEditingWorkout(workout || null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      if (editingWorkout) {
        refreshWorkouts();
      }
      setEditingWorkout(null);
    }
  };

  const handleSaveWorkout = async (workout: WorkoutFormData) => {
    const result = await withToastError(async () => {
      if (editingWorkout) {
        return await updateWorkoutAction(
          editingWorkout.id,
          workout,
          selectedDay,
          weekStartDateISO,
        );
      } else {
        return await createWorkoutAction(
          workout,
          selectedDay,
          weekStartDateISO,
        );
      }
    }, "Failed to save workout");
    if (!result) return;
    refreshWorkouts();
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const result = await withToastError(async () => {
      await deleteWorkoutAction(workoutId);
      return true as const;
    }, "Failed to delete workout");
    if (!result) return;
    refreshWorkouts();
  };

  const displayWorkouts = getDisplayWorkouts();

  const renderDragOverlay = () => {
    if (!activeId) return null;

    if (activeDragType === "pill") {
      const pill = pills.find((p) => p.id === activeId);
      if (pill) return <PillChip pill={pill} isOverlay />;
    }

    if (activeDragType === "group") {
      const group = groups.find((g) => g.id === activeId);
      if (group) return <PillGroupCard group={group} isOverlay />;
    }

    if (activeDragType === "preset") {
      const preset = presets.find(
        (presetItem) => `preset-${presetItem.id}` === activeId,
      );
      if (preset) return <PresetChip preset={preset} isOverlay />;
    }

    if (activeDragType === "activity") {
      const activity = standaloneActivities.find(
        (activityItem) => `activity-${activityItem.id}` === activeId,
      );
      if (activity) {
        return (
          <div style={{ cursor: "grabbing" }}>
            <WorkoutCard
              kind="activity"
              sport={activity.sport}
              title={activity.title}
              distance={activity.distance}
              duration={activity.duration}
            />
          </div>
        );
      }
    }

    const workout = displayWorkouts.find(
      (workoutItem) => workoutItem.id === activeId,
    );
    if (workout) {
      return (
        <div style={{ cursor: "grabbing" }}>
          <WorkoutCard
            kind="planned"
            sport={workout.sport}
            workoutType={workout.workoutType}
            heartRateZone={workout.heartRateZone}
            distance={workout.distance ?? 0}
            duration={workout.duration}
            completed={workout.completed}
          />
        </div>
      );
    }

    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="mt-7 space-y-4">
        {/* V1 Header */}
        <header className="flex items-end justify-between">
          <div>
            <h1 className="font-display m-0 text-[44px] leading-[1.05] font-normal tracking-tight">
              This week&apos;s <em className="text-coral-deep">training</em>
            </h1>
            <p className="text-ink-soft mt-1.5 text-sm">
              Plan your week. Strava activities sync automatically.
            </p>
          </div>

          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="border-line bg-surface hover:bg-bg-soft rounded-full transition-shadow hover:shadow-[inset_0_0_0_4px_white] active:scale-105"
              aria-label="Previous week"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setWeekOffset(0)}
              className="border-line bg-surface hover:bg-bg-soft rounded-full px-4 text-[13px] hover:shadow-lg active:translate-y-0.5 active:shadow-[inset_0_0_0_3px_white]"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="border-line bg-surface hover:bg-bg-soft rounded-full transition-shadow hover:shadow-[inset_0_0_0_4px_white] active:scale-105"
              aria-label="Next week"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <span className="text-ink-soft ml-3 font-mono text-[13px]">
              {formatDateDisplay(weekDates[0])} &mdash;{" "}
              {formatDateDisplay(weekDates[6])}
            </span>
          </div>
        </header>

        {/* Pending changes bar */}
        {pendingChanges.size > 0 && (
          <div className="border-line bg-surface flex items-center justify-end gap-2 rounded-[18px] border p-3">
            <span className="text-ink-soft mr-auto text-sm">
              {pendingChanges.size} workout
              {pendingChanges.size > 1 ? "s" : ""} moved
            </span>
            <Button variant="outline" onClick={cancelPendingChanges}>
              Cancel
            </Button>
            <Button onClick={savePendingChanges}>Save Changes</Button>
          </div>
        )}

        {/* Stats strip — only planned workouts */}
        <StatsStrip workouts={displayWorkouts} />

        {/* 7-day grid */}
        <div className="grid grid-cols-7 items-start gap-2.5">
          {DAYS_OF_WEEK.map((day, index) => {
            const date = weekDates[index];
            const isToday =
              formatDateToISO(date) === formatDateToISO(new Date());
            const dayWorkouts = displayWorkouts.filter(
              (workout) =>
                workout.dayOfWeek === day &&
                workout.weekStartDate === weekStartDateISO,
            );
            const dayActivities = standaloneActivities.filter(
              (activity) => activity.dayOfWeek === day,
            );

            return (
              <div
                key={day}
                className={`bg-surface flex min-h-50 flex-col gap-2.5 rounded-[18px] border p-3 ${
                  isToday ? "border-coral-deep border-[1.5px]" : "border-line"
                }`}
              >
                {/* Day header */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className={`text-[13px] font-semibold tracking-[0.02em] uppercase ${
                        isToday ? "text-coral-deep" : "text-foreground"
                      }`}
                    >
                      {getDayName(day).slice(0, 3)}
                    </div>
                    <div className="text-ink-faint mt-0.5 font-mono text-[11px]">
                      {formatDateDisplay(date)}
                    </div>
                  </div>
                  {isToday && (
                    <span className="font-display text-coral-deep text-[13px] italic">
                      today
                    </span>
                  )}
                </div>

                {/* Planned workouts (sortable) + standalone activities */}
                <div className="flex max-h-56 flex-1 flex-col overflow-y-auto">
                  <SortableDay
                    day={day}
                    workoutIds={dayWorkouts.map((workout) => workout.id)}
                    isDragActive={activeId !== null}
                  >
                    {dayWorkouts.map((workout) => (
                      <SortableWorkoutCard key={workout.id} id={workout.id}>
                        <WorkoutCard
                          kind="planned"
                          sport={workout.sport}
                          workoutType={workout.workoutType}
                          heartRateZone={workout.heartRateZone}
                          distance={workout.distance ?? 0}
                          duration={workout.duration}
                          completed={workout.completed}
                          syncStatus={workout.syncStatus}
                          actualDistance={workout.actualDistance}
                          actualDuration={workout.actualDuration}
                          onClick={() => handleOpenDialog(day, workout)}
                        />
                      </SortableWorkoutCard>
                    ))}
                    {dayActivities.map((activity) => (
                      <DraggableActivityCard
                        key={activity.id}
                        activityId={activity.id}
                      >
                        <WorkoutCard
                          kind="activity"
                          sport={activity.sport}
                          title={activity.title}
                          distance={activity.distance}
                          duration={activity.duration}
                          pace={activity.pace ?? null}
                          onClick={() => setViewingActivity(activity)}
                        />
                      </DraggableActivityCard>
                    ))}
                  </SortableDay>
                </div>

                {/* Add workout button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDialog(day)}
                  className="border-line bg-bg-soft hover:bg-bg-soft rounded-full px-2.5 text-xs transition-transform hover:scale-105"
                >
                  <Plus className="h-3 w-3" />
                  Add workout
                </Button>
              </div>
            );
          })}
        </div>

        {/* Playground + Presets */}
        <PlaygroundArea
          items={items}
          onAddPill={addPill}
          isDragActive={activeId !== null}
          activeId={activeId}
          activeDragType={activeDragType}
          remainingSlots={remainingSlots}
          onSaveAsPreset={addPreset}
          presets={presets}
        />

        <AddWorkoutDialog
          open={isDialogOpen}
          onOpenChange={handleCloseDialog}
          dayOfWeek={selectedDay}
          onSave={handleSaveWorkout}
          onDelete={handleDeleteWorkout}
          editWorkout={
            editingWorkout
              ? {
                  id: editingWorkout.id,
                  sport: editingWorkout.sport,
                  workoutType: editingWorkout.workoutType,
                  heartRateZone: editingWorkout.heartRateZone,
                  distance: editingWorkout.distance ?? 0,
                  duration: editingWorkout.duration,
                  pace: editingWorkout.pace,
                  title: editingWorkout.title,
                  notes: editingWorkout.notes,
                  syncStatus: editingWorkout.syncStatus,
                  linkedActivityId:
                    editingWorkout.linkedActivityId ?? undefined,
                  actualDistance: editingWorkout.actualDistance ?? undefined,
                  actualDuration: editingWorkout.actualDuration ?? undefined,
                  completed: editingWorkout.completed,
                }
              : undefined
          }
        />

        {/* Read-only detail dialog for standalone activities */}
        <ActivityDetailDialog
          activity={viewingActivity}
          onOpenChange={(open) => {
            if (!open) setViewingActivity(null);
          }}
          onDelete={async (activityId) => {
            const result = await withToastError(async () => {
              await deleteActivityAction(activityId);
              return true as const;
            }, "Failed to delete activity");
            if (!result) return;
            setViewingActivity(null);
            refreshWorkouts();
          }}
        />

        <DragOverlay>
          <div
            className={`transition-transform duration-200 ${isOverTrash ? "scale-75 opacity-60" : ""}`}
          >
            {renderDragOverlay()}
          </div>
        </DragOverlay>
        <TrashBin isDragActive={activeId !== null} />
      </div>
    </DndContext>
  );
}
