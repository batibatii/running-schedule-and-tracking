"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { DroppableDay } from "./DroppableDay";
import { DroppableWorkoutCard } from "./DroppableWorkoutCard";
import { PlaygroundArea } from "@/components/playground/PlaygroundArea";
import { PillChip } from "@/components/playground/PillChip";
import { PillGroupCard } from "@/components/playground/PillGroupCard";
import { PresetSection } from "@/components/playground/PresetSection";
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
  // Week navigation state (0 = this week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");
  const [offsetHighlightDate, setOffsetHighlightDate] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
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

  // Unified DnD manager
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

  // Week navigation
  const daysOfWeek: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleToday = () => {
    setWeekOffset(0);
  };

  const handleDayClick = (date: Date) => {
    const dateISO = formatDateToISO(date);

    if (offsetHighlightDate === dateISO) {
      setOffsetHighlightDate(null);
    } else {
      setOffsetHighlightDate(dateISO);
    }
  };

  // Build the DragOverlay content based on what's being dragged
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
      const preset = presets.find((p) => `preset-${p.id}` === activeId);
      if (preset) return <PresetChip preset={preset} isOverlay />;
    }

    const workout = getDisplayWorkouts().find((w) => w.id === activeId);
    if (workout) {
      return (
        <div style={{ cursor: "grabbing" }}>
          <WorkoutCard
            sport={workout.sport}
            workoutType={workout.workoutType}
            heartRateZone={workout.heartRateZone}
            distance={workout.distance ?? 0}
            duration={workout.duration}
            title={workout.title}
            notes={workout.notes}
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
      <div className="space-y-4">
        {pendingChanges.size > 0 && (
          <div className="bg-muted flex items-center justify-end gap-2 rounded-md p-3">
            <span className="text-muted-foreground mr-auto text-sm">
              {pendingChanges.size} workout{pendingChanges.size > 1 ? "s" : ""}{" "}
              moved
            </span>
            <Button variant="outline" onClick={cancelPendingChanges}>
              Cancel
            </Button>
            <Button onClick={savePendingChanges}>Save Changes</Button>
          </div>
        )}
        {/* Week Navigation Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button variant="outline" onClick={handleToday}>
              Today
            </Button>
          </div>

          <div className="text-lg font-semibold">
            {formatDateDisplay(weekDates[0])} -{" "}
            {formatDateDisplay(weekDates[6])}
          </div>
        </div>

        {/* Weekly Schedule Grid */}
        <div className="grid max-w-385 grid-cols-7 items-start gap-2">
          {daysOfWeek.map((day, index) => {
            const date = weekDates[index];
            const isToday =
              formatDateToISO(date) === formatDateToISO(new Date());
            const isOffsetHighlighted =
              offsetHighlightDate === formatDateToISO(date);

            return (
              <Card
                key={day}
                className={`flex min-h-60 cursor-pointer flex-col transition-colors ${isToday ? "ring-primary ring-2" : isOffsetHighlighted ? "ring-primary/50 ring-2" : ""}`}
              >
                {/* Day Header */}
                <div
                  className="shrink-0 border-b p-3"
                  onClick={() => handleDayClick(date)}
                >
                  <div className="text-sm font-semibold">{getDayName(day)}</div>
                  <div
                    className={`text-xs ${
                      isToday
                        ? "text-primary font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {formatDateDisplay(date)}
                  </div>
                </div>

                {/* Workouts Container */}
                <div className="flex flex-1 flex-col">
                  <div className="max-h-66 overflow-y-auto">
                    <DroppableDay day={day}>
                      <div className="flex-1 space-y-2 px-2 py-4">
                        {(() => {
                          const dayWorkouts = getDisplayWorkouts().filter(
                            (w) =>
                              w.dayOfWeek === day &&
                              w.weekStartDate ===
                                formatDateToISO(weekStartDate),
                          );
                          return dayWorkouts.length > 0 ? (
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
                                  title={workout.title}
                                  notes={workout.notes}
                                  onClick={() => handleOpenDialog(day, workout)}
                                />
                              </DroppableWorkoutCard>
                            ))
                          ) : (
                            <div className="text-muted-foreground py-8 text-center text-xs">
                              No workouts
                            </div>
                          );
                        })()}
                      </div>
                    </DroppableDay>
                  </div>

                  <div className="p-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleOpenDialog(day)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="max-w-385">
          <PlaygroundArea
            items={items}
            onAddPill={addPill}
            isDragActive={activeId !== null}
            activeId={activeId}
            activeDragType={activeDragType}
            onSaveAsPreset={addPreset}
          />
          <div className="mt-2">
            <PresetSection presets={presets} onDeletePreset={removePreset} />
          </div>
        </div>

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
