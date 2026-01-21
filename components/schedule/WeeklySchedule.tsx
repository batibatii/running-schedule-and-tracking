"use client";

import { useState, useEffect, useCallback } from "react";
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
import { WorkoutFormData } from "@/types/workoutValidation";
import { useAsyncData } from "@/hooks/useAsyncData";
import {
  fetchWorkoutsAction,
  createWorkoutAction,
} from "@/app/actions/workout";

export function WeeklySchedule() {
  // Week navigation state (0 = this week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");

  const handleOpenDialog = (day: DayOfWeek) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const {
    data: workouts,
    loading,
    error,
    execute: fetchWorkouts,
  } = useAsyncData<Workout[]>();

  const weekStartDate = getWeekStartDate(weekOffset);
  const weekDates = getWeekDates(weekStartDate);
  const weekStartDateISO = formatDateToISO(weekStartDate);

  const fetchWorkoutsFromAPI = useCallback(async (): Promise<Workout[]> => {
    return fetchWorkoutsAction(weekStartDateISO);
  }, [weekStartDateISO]);

  useEffect(() => {
    fetchWorkouts(fetchWorkoutsFromAPI);
  }, [fetchWorkouts, fetchWorkoutsFromAPI]);

  const handleSaveWorkout = async (workout: WorkoutFormData) => {
    await createWorkoutAction(workout, selectedDay, weekStartDateISO);

    fetchWorkouts(fetchWorkoutsFromAPI);
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

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleToday = () => {
    setWeekOffset(0);
  };

  return (
    <div className="space-y-4">
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
          {formatDateDisplay(weekDates[0])} - {formatDateDisplay(weekDates[6])}
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-7 gap-2 ">
        {daysOfWeek.map((day, index) => {
          const date = weekDates[index];
          const isToday = formatDateToISO(date) === formatDateToISO(new Date());

          return (
            <Card
              key={day}
              className={`min-h-75 ${isToday ? "ring-2 ring-primary" : ""}`}
            >
              {/* Day Header */}
              <div className="border-b p-3">
                <div className="text-sm font-semibold">{getDayName(day)}</div>
                <div
                  className={`text-xs ${
                    isToday ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {formatDateDisplay(date)}
                </div>
              </div>

              {/* Workouts Container */}
              <div className="p-2 space-y-2">
                {/* Filter and render workouts for this day */}
                {(workouts ?? [])
                  .filter(
                    (w) =>
                      w.dayOfWeek === day &&
                      w.weekStartDate === formatDateToISO(weekStartDate),
                  )
                  .map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      id={workout.id}
                      workoutType={workout.workoutType}
                      heartRateZone={workout.heartRateZone}
                      distance={workout.distance ?? 0}
                      duration={workout.duration}
                      title={workout.title}
                      notes={workout.notes}
                    />
                  ))}

                {/* Show empty state only if no workouts for this day */}
                {(workouts ?? []).filter(
                  (w) =>
                    w.dayOfWeek === day &&
                    w.weekStartDate === formatDateToISO(weekStartDate),
                ).length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-8">
                    No workouts
                  </div>
                )}

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
            </Card>
          );
        })}
      </div>

      <AddWorkoutDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        dayOfWeek={selectedDay}
        weekStartDate={formatDateToISO(weekStartDate)}
        onSave={handleSaveWorkout}
      />
    </div>
  );
}
