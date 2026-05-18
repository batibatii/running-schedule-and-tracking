"use client";

import { useState, useEffect } from "react";
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
import { AddWorkoutDialog } from "./AddWorkoutDialog";
import { WorkoutCard } from "./WorkoutCard";
import { StatsStrip } from "./StatsStrip";
import { DroppableDay } from "./DroppableDay";
import { DroppableWorkoutCard } from "./DroppableWorkoutCard";
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
  fetchWorkoutsAction,
  createWorkoutAction,
  updateWorkoutAction,
  deleteWorkoutAction,
} from "@/app/actions/workout";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  pointerWithin,
} from "@dnd-kit/core";

export function WeeklySchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const { data: workouts, execute: fetchWorkouts } = useAsyncData<Workout[]>();

  const weekStartDate = getWeekStartDate(weekOffset);
  const weekDates = getWeekDates(weekStartDate);
  const weekStartDateISO = formatDateToISO(weekStartDate);

  const refreshWorkouts = () => {
    fetchWorkouts(() => fetchWorkoutsAction(weekStartDateISO));
  };

  useEffect(() => {
    refreshWorkouts();
  }, [weekStartDateISO]);

  const {
    items,
    pills,
    groups,
    addPill,
    addExistingPill,
    removePill,
    addGroup,
    updateGroup,
    removeItem,
    resolvePillToFields,
    getWorkoutDefaults,
  } = usePlayground();

  const { presets, addPreset, removePreset } = usePresets();

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
    if (editingWorkout) {
      await updateWorkoutAction(
        editingWorkout.id,
        workout,
        selectedDay,
        weekStartDateISO,
      );
    } else {
      await createWorkoutAction(workout, selectedDay, weekStartDateISO);
    }
    refreshWorkouts();
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    await deleteWorkoutAction(workoutId);
    refreshWorkouts();
  };

  const daysOfWeek: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

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

    const workout = displayWorkouts.find(
      (workoutItem) => workoutItem.id === activeId,
    );
    if (workout) {
      return (
        <div style={{ cursor: "grabbing" }}>
          <WorkoutCard
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
              Plan, drag and drop your weekly mix. Strava syncs every morning.
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

        {/* Stats strip */}
        <StatsStrip workouts={displayWorkouts} />

        {/* 7-day grid */}
        <div className="grid grid-cols-7 items-start gap-2.5">
          {daysOfWeek.map((day, index) => {
            const date = weekDates[index];
            const isToday =
              formatDateToISO(date) === formatDateToISO(new Date());
            const dayWorkouts = displayWorkouts.filter(
              (workout) =>
                workout.dayOfWeek === day &&
                workout.weekStartDate === weekStartDateISO,
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

                {/* Workouts */}
                <div className="flex max-h-56 flex-1 flex-col overflow-y-auto">
                  <DroppableDay day={day}>
                    <div className="flex flex-1 flex-col gap-2">
                      {dayWorkouts.length > 0 ? (
                        dayWorkouts.map((workout) => (
                          <DroppableWorkoutCard
                            key={workout.id}
                            id={workout.id}
                          >
                            <WorkoutCard
                              sport={workout.sport}
                              workoutType={workout.workoutType}
                              heartRateZone={workout.heartRateZone}
                              distance={workout.distance ?? 0}
                              duration={workout.duration}
                              completed={workout.completed}
                              onClick={() => handleOpenDialog(day, workout)}
                            />
                          </DroppableWorkoutCard>
                        ))
                      ) : (
                        <div className="border-line-strong text-ink-faint flex min-h-15 flex-1 items-center justify-center rounded-2xl border border-dashed text-[11px]">
                          Drop here
                        </div>
                      )}
                    </div>
                  </DroppableDay>
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
          onSaveAsPreset={addPreset}
          presets={presets}
          onDeletePreset={removePreset}
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
                }
              : undefined
          }
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
