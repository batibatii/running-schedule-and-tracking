"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  getWeekStartDate,
  getWeekDates,
  formatDateDisplay,
  formatDateToISO,
  getDayOfWeek,
  getDayName,
} from "@/lib/utils/date";
import { DayOfWeek } from "@/types/workout";
import { AddWorkoutDialog } from "./AddWorkoutDialog";
import { WorkoutCard } from "./WorkoutCard";
import { WorkoutFormData } from "@/types/workoutValidation";

export function WeeklySchedule() {
  // Week navigation state (0 = this week, -1 = last week, 1 = next week)
  const [weekOffset, setWeekOffset] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("monday");

  const [workouts, setWorkouts] = useState<
    Array<
      WorkoutFormData & {
        dayOfWeek: DayOfWeek;
        weekStartDate: string;
        id: string;
      }
    >
  >([]);

  const handleOpenDialog = (day: DayOfWeek) => {
    setSelectedDay(day);
    setIsDialogOpen(true);
  };

  const handleSaveWorkout = async (workout: WorkoutFormData) => {
    const newWorkout = {
      ...workout,
      dayOfWeek: selectedDay,
      weekStartDate: formatDateToISO(weekStartDate),
      id: crypto.randomUUID(), // Temporary ID for local state
    };
    setWorkouts((prev) => [...prev, newWorkout]);
  };

  const weekStartDate = getWeekStartDate(weekOffset);
  const weekDates = getWeekDates(weekStartDate);

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
                {workouts
                  .filter(
                    (w) =>
                      w.dayOfWeek === day &&
                      w.weekStartDate === formatDateToISO(weekStartDate)
                  )
                  .map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      id={workout.id}
                      workoutType={workout.workoutType}
                      heartRateZone={workout.heartRateZone}
                      distance={workout.distance}
                      duration={workout.duration}
                      title={workout.title}
                      notes={workout.notes}
                    />
                  ))}

                {/* Show empty state only if no workouts for this day */}
                {workouts.filter(
                  (w) =>
                    w.dayOfWeek === day &&
                    w.weekStartDate === formatDateToISO(weekStartDate)
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
