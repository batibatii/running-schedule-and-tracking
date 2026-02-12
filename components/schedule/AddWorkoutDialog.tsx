"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { SuccessAlert } from "@/components/alert/SuccessAlert";
import { ErrorAlert } from "@/components/alert/ErrorAlert";
import { useAsyncData } from "@/hooks/useAsyncData";
import { workoutFormSchema, WorkoutFormData } from "@/types/workoutValidation";
import { DayOfWeek, WorkoutType, HeartRateZone } from "@/types/workout";
import { useEffect, useState } from "react";
import { calculateDuration, calculatePaceFromDuration } from "@/lib/utils/pace";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface AddOrEditWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayOfWeek: DayOfWeek;
  weekStartDate: string;
  onSave: (workout: WorkoutFormData) => Promise<void>;
  onDelete?: (workoutId: string) => Promise<void>;
  editWorkout?: {
    id: string;
    heartRateZone: string;
    workoutType: WorkoutType;
    distance: number;
    duration?: number;
    title?: string;
    notes?: string;
  };
}

export function AddWorkoutDialog({
  open,
  onOpenChange,
  dayOfWeek,
  onSave,
  editWorkout,
  onDelete,
}: AddOrEditWorkoutDialogProps) {
  const {
    loading,
    error,
    success,
    execute,
    reset: resetAsync,
  } = useAsyncData();

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      workoutType: "",
      heartRateZone: "",
      distance: "",
      duration: "",
      pace: "",
      title: "",
      notes: "",
    },
  });

  const workoutType = watch("workoutType");
  const heartRateZone = watch("heartRateZone");
  const distance = watch("distance");
  const pace = watch("pace");

  useEffect(() => {
    if (distance && pace && /^\d{1,2}:\d{2}$/.test(pace)) {
      const calculatedDuration = calculateDuration(Number(distance), pace);
      // Use toLocaleString with 'en-US' to ensure period as decimal separator
      setValue(
        "duration",
        calculatedDuration.toLocaleString("en-US", {
          useGrouping: false,
          maximumFractionDigits: 2,
        }),
      );
    }
  }, [distance, pace, setValue]);

  useEffect(() => {
    if (editWorkout && open) {
      resetAsync();
      reset({
        workoutType: editWorkout.workoutType,
        heartRateZone: editWorkout.heartRateZone,
        distance: String(editWorkout.distance),
        duration: editWorkout.duration
          ? editWorkout.duration.toLocaleString("en-US", {
              useGrouping: false,
              maximumFractionDigits: 2,
            })
          : "",
        pace:
          editWorkout.distance && editWorkout.duration
            ? calculatePaceFromDuration(
                editWorkout.distance,
                editWorkout.duration,
              )
            : "",
        title: editWorkout.title || "",
        notes: editWorkout.notes || "",
      });
    } else if (!editWorkout && open) {
      resetAsync();
      reset({
        workoutType: "",
        heartRateZone: "",
        distance: "",
        duration: "",
        pace: "",
        title: "",
        notes: "",
      });
    }
  }, [editWorkout, open, reset, resetAsync]);

  const onSubmit = async (data: WorkoutFormData) => {
    await execute(async () => {
      await onSave(data);

      // For edit mode, close immediately. For add mode, show success briefly
      if (editWorkout) {
        reset();
        resetAsync();
        onOpenChange(false);
      } else {
        setTimeout(() => {
          reset();
          resetAsync();
          onOpenChange(false);
        }, 1000);
      }
    });
  };

  const handleDelete = async () => {
    if (!editWorkout || !onDelete) return;

    await execute(async () => {
      await onDelete(editWorkout.id);
      reset();
      resetAsync();
      setShowDeleteAlert(false);
      onOpenChange(false);
    });
  };

  const handleClose = () => {
    reset();
    resetAsync();
    onOpenChange(false);
  };

  const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {editWorkout ? "Edit Workout" : "Add Workout"} - {dayName}
            </DialogTitle>
            <DialogDescription>
              {editWorkout ? "Update your" : "Plan your"} running workout for{" "}
              {dayName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && <ErrorAlert message={error} />}
            {success && (
              <SuccessAlert
                message={
                  editWorkout
                    ? "Workout updated successfully!"
                    : "Workout added successfully!"
                }
              />
            )}

            <div className="grid gap-2">
              <Label htmlFor="workoutType">
                Workout Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={workoutType}
                onValueChange={(value: string) =>
                  setValue("workoutType", value as WorkoutType)
                }
              >
                <SelectTrigger id="workoutType">
                  <SelectValue placeholder="Select workout type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy Run</SelectItem>
                  <SelectItem value="tempo">Tempo Run</SelectItem>
                  <SelectItem value="interval">Interval Training</SelectItem>
                  <SelectItem value="long">Long Run</SelectItem>
                  <SelectItem value="recovery">Recovery Run</SelectItem>
                  <SelectItem value="race">Race</SelectItem>
                </SelectContent>
              </Select>
              {errors.workoutType && (
                <p className="text-sm text-destructive pl-1">
                  {errors.workoutType.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="heartRateZone">
                Heart Rate Zone <span className="text-destructive">*</span>
              </Label>
              <Select
                value={heartRateZone}
                onValueChange={(value: string) =>
                  setValue("heartRateZone", value as HeartRateZone)
                }
              >
                <SelectTrigger id="heartRateZone">
                  <SelectValue placeholder="Select heart rate zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone-1">Zone 1 (Recovery)</SelectItem>
                  <SelectItem value="zone-2">Zone 2 (Aerobic)</SelectItem>
                  <SelectItem value="zone-3">Zone 3 (Tempo)</SelectItem>
                  <SelectItem value="zone-4">Zone 4 (Threshold)</SelectItem>
                  <SelectItem value="zone-5">Zone 5 (Max)</SelectItem>
                </SelectContent>
              </Select>
              {errors.heartRateZone && (
                <p className="text-sm text-destructive pl-1">
                  {errors.heartRateZone.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="distance">
                Distance (km) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g., 10"
                {...register("distance")}
              />
              {errors.distance && (
                <p className="text-sm text-destructive pl-1">
                  {errors.distance.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pace">Pace (min/km)</Label>
              <Input
                id="pace"
                type="text"
                placeholder="e.g., 5:30"
                {...register("pace")}
              />
              {errors.pace && (
                <p className="text-sm text-destructive">
                  {errors.pace.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                step="0.01"
                min="0"
                {...register("duration")}
              />
              {errors.duration && (
                <p className="text-sm text-destructive">
                  {errors.duration.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Morning tempo run"
                {...register("title")}
              />
              {errors.title && (
                <p className="text-sm text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Training details, how you felt, etc."
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-destructive">
                  {errors.notes.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {editWorkout && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                disabled={loading}
                className="hover:shadow-sm"
              >
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              {" "}
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || (editWorkout && !isDirty)}
              >
                {loading
                  ? editWorkout
                    ? "Saving..."
                    : "Adding..."
                  : editWorkout
                    ? "Save Changes"
                    : "Add Workout"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this
              workout from your schedule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              className="hover:shadow-sm active:translate-y-0.5"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
