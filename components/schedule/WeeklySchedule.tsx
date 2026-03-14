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
import { DraggableWorkoutCard } from "./DraggableWorkoutCard";
import { PlaygroundArea } from "@/components/playground/PlaygroundArea";
import { PillChip } from "@/components/playground/PillChip";
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

  // Playground hook
  const {
    pills,
    addPill,
    removePill,
    resolvePillToFields,
    getWorkoutDefaults,
  } = usePlayground();

  // Unified DnD manager
  const {
    activeId,
    activeDragType,
    pendingChanges,
    handleDragStart,
    handleDragEnd,
    savePendingChanges,
    cancelPendingChanges,
    getDisplayWorkouts,
  } = useDragDropManager({
    workouts,
    weekStartDateISO,
    removePill,
    resolvePillToFields,
    getWorkoutDefaults,
    refreshWorkouts,
  });

  // Dialog handlers
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

    // Default: workout card overlay
    const workout = getDisplayWorkouts().find((w) => w.id === activeId);
    if (workout) {
      return (
        <div style={{ cursor: "grabbing" }}>
          <WorkoutCard
            id={workout.id}
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
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {pendingChanges.size > 0 && (
          <div className="flex items-center justify-end gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm text-muted-foreground mr-auto">
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
        <div className="grid grid-cols-7 gap-2 items-start max-w-385">
          {daysOfWeek.map((day, index) => {
            const date = weekDates[index];
            const isToday =
              formatDateToISO(date) === formatDateToISO(new Date());
            const isOffsetHighlighted =
              offsetHighlightDate === formatDateToISO(date);

            return (
              <Card
                key={day}
                className={`min-h-60 flex flex-col cursor-pointer transition-colors ${isToday ? "ring-2 ring-primary" : isOffsetHighlighted ? "ring-2 ring-primary/50" : ""}`}
              >
                {/* Day Header */}
                <div
                  className="border-b p-3 shrink-0 "
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
                <div className="flex flex-col flex-1">
                  <div className="overflow-y-auto max-h-66">
                    <DroppableDay day={day}>
                      <div className="p-2 space-y-2 ">
                        {getDisplayWorkouts()
                          .filter(
                            (w) =>
                              w.dayOfWeek === day &&
                              w.weekStartDate ===
                                formatDateToISO(weekStartDate),
                          )
                          .map((workout) => (
                            <DraggableWorkoutCard
                              key={workout.id}
                              id={workout.id}
                            >
                              <WorkoutCard
                                id={workout.id}
                                sport={workout.sport}
                                workoutType={workout.workoutType}
                                heartRateZone={workout.heartRateZone}
                                distance={workout.distance ?? 0}
                                duration={workout.duration}
                                title={workout.title}
                                notes={workout.notes}
                                onClick={() => handleOpenDialog(day, workout)}
                              />
                            </DraggableWorkoutCard>
                          ))}

                        {getDisplayWorkouts().filter(
                          (w) =>
                            w.dayOfWeek === day &&
                            w.weekStartDate === formatDateToISO(weekStartDate),
                        ).length === 0 && (
                          <div className="text-xs text-muted-foreground text-center py-8">
                            No workouts
                          </div>
                        )}
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
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Playground */}
        <div className="max-w-385">
          <PlaygroundArea
            pills={pills}
            onAddPill={addPill}
            isDragActive={activeId !== null}
          />
        </div>

        <AddWorkoutDialog
          open={isDialogOpen}
          onOpenChange={handleCloseDialog}
          dayOfWeek={selectedDay}
          weekStartDate={formatDateToISO(weekStartDate)}
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
                  title: editingWorkout.title,
                  notes: editingWorkout.notes,
                }
              : undefined
          }
        />
        <DragOverlay>{renderDragOverlay()}</DragOverlay>
      </div>
    </DndContext>
  );
}
