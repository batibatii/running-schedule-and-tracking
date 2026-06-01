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
import {
  DayOfWeek,
  WorkoutType,
  HeartRateZone,
  Sport,
  SPORTS,
  WORKOUT_TYPES,
} from "@/types/workout";
import {
  getSportDisplayName,
  WORKOUT_TYPE_LABELS,
  SPORT_WORKOUT_TYPES,
  isCompatibleWorkoutType,
} from "@/lib/utils/workoutLabels";
import { useEffect, useState } from "react";
import {
  calculateDuration,
  calculatePaceFromDuration,
  formatDurationClock,
  minutesToPace,
} from "@/lib/utils/pace";
import { updateWorkoutSyncStatusAction } from "@/app/actions/workout";
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
  onSave: (workout: WorkoutFormData) => Promise<void>;
  onDelete?: (workoutId: string) => Promise<void>;
  editWorkout?: {
    id: string;
    sport: Sport;
    heartRateZone: string;
    workoutType: WorkoutType;
    distance: number;
    duration?: number;
    pace?: string;
    title?: string;
    notes?: string;
    // Strava sync fields
    syncStatus?: "strava" | "manual" | null;
    linkedActivityId?: string;
    actualDistance?: number;
    actualDuration?: number;
    completed?: boolean;
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

  // Status toggle — local only, persisted on save
  type WorkoutStatus = "planned" | "completed" | "missed";
  const deriveStatus = (): WorkoutStatus => {
    if (!editWorkout) return "planned";
    if (editWorkout.completed) return "completed";
    if (editWorkout.syncStatus != null) return "missed";
    return "planned";
  };
  const [workoutStatus, setWorkoutStatus] =
    useState<WorkoutStatus>(deriveStatus);
  const [initialStatus, setInitialStatus] =
    useState<WorkoutStatus>(deriveStatus);

  // Re-derive status when editWorkout changes (opening a different workout)
  useEffect(() => {
    const status = deriveStatus();
    setWorkoutStatus(status);
    setInitialStatus(status);
  }, [editWorkout?.id, open]);

  const statusChanged = workoutStatus !== initialStatus;

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
      sport: "running",
      workoutType: "",
      heartRateZone: "",
      distance: "",
      duration: "",
      pace: "",
      title: "",
      notes: "",
    },
  });

  const sport = watch("sport");
  const workoutType = watch("workoutType");
  const heartRateZone = watch("heartRateZone");
  const distance = watch("distance");
  const pace = watch("pace");

  useEffect(() => {
    if (
      workoutType &&
      sport &&
      !isCompatibleWorkoutType(sport as Sport, workoutType as WorkoutType)
    ) {
      setValue("workoutType", "");
    }
  }, [sport, workoutType, setValue]);

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
        sport: editWorkout.sport,
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
          editWorkout.pace ||
          (editWorkout.distance && editWorkout.duration
            ? calculatePaceFromDuration(
                editWorkout.distance,
                editWorkout.duration,
              )
            : ""),
        title: editWorkout.title || "",
        notes: editWorkout.notes || "",
      });
    } else if (!editWorkout && open) {
      resetAsync();
      reset({
        sport: "running",
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

      if (editWorkout && statusChanged) {
        await updateWorkoutSyncStatusAction(editWorkout.id, workoutStatus);
      }

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

  const handleStatusOnlySave = async () => {
    if (!editWorkout || !statusChanged) return;
    await execute(async () => {
      await updateWorkoutSyncStatusAction(editWorkout.id, workoutStatus);
      reset();
      resetAsync();
      onOpenChange(false);
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
    setWorkoutStatus(initialStatus);
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

          {/* Status toggle — edit mode only */}
          {editWorkout && (
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-bg-soft inline-flex gap-0.5 rounded-full p-1">
                {(["planned", "completed", "missed"] as const).map(
                  (statusOption) => (
                    <Button
                      key={statusOption}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setWorkoutStatus(statusOption)}
                      className={`rounded-full px-4 text-xs font-semibold capitalize ${
                        workoutStatus === statusOption
                          ? statusOption === "completed"
                            ? "bg-mint-deep hover:bg-mint-deep text-white"
                            : statusOption === "missed"
                              ? "bg-butter hover:bg-butter text-[#705220]"
                              : "bg-surface text-foreground hover:bg-surface shadow-sm"
                          : "text-ink-soft hover:bg-bg-soft"
                      }`}
                    >
                      {statusOption}
                    </Button>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Actual data from Strava — read-only */}
          {editWorkout?.linkedActivityId && (
            <div className="bg-bg-soft mt-4 rounded-xl px-4 py-3">
              <p className="text-ink-faint mb-2 text-[11px] font-medium tracking-wider uppercase">
                Actual (Strava)
              </p>
              <div className="flex items-center gap-4 font-mono text-sm">
                {editWorkout.actualDistance != null && (
                  <span>
                    <span className="text-ink font-semibold">
                      {editWorkout.actualDistance.toFixed(1)}
                    </span>
                    <span className="text-ink-soft"> km</span>
                  </span>
                )}
                {editWorkout.actualDuration != null && (
                  <span>
                    <span className="text-ink font-semibold">
                      {formatDurationClock(editWorkout.actualDuration)}
                    </span>
                  </span>
                )}
                {editWorkout.actualDistance != null &&
                  editWorkout.actualDuration != null &&
                  editWorkout.actualDistance > 0 && (
                    <span>
                      <span className="text-ink font-semibold">
                        {minutesToPace(
                          editWorkout.actualDuration /
                            editWorkout.actualDistance,
                        )}
                      </span>
                      <span className="text-ink-soft"> /km</span>
                    </span>
                  )}
              </div>
            </div>
          )}

          <div className="grid gap-4 py-4">
            {/* Section label when actual data is shown */}
            {editWorkout?.linkedActivityId && (
              <p className="text-ink-faint text-[11px] font-medium tracking-wider uppercase">
                Planned
              </p>
            )}
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
              <Label htmlFor="sport">
                Sport <span className="text-destructive">*</span>
              </Label>
              <Select
                value={sport}
                onValueChange={(value: string) =>
                  setValue("sport", value as Sport, { shouldDirty: true })
                }
              >
                <SelectTrigger id="sport">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {getSportDisplayName(sport)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sport && (
                <p className="text-destructive pl-1 text-sm">
                  {errors.sport.message}
                </p>
              )}
            </div>

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
                  {(SPORT_WORKOUT_TYPES[sport as Sport] ?? WORKOUT_TYPES).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {WORKOUT_TYPE_LABELS[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {errors.workoutType && (
                <p className="text-destructive pl-1 text-sm">
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
                <p className="text-destructive pl-1 text-sm">
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
                <p className="text-destructive pl-1 text-sm">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
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
                <p className="text-destructive text-sm">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                className="min-h-20"
                placeholder="Training details, how you felt, etc."
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-destructive text-sm">
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
            <div className="ml-auto flex gap-2">
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
                type={
                  editWorkout && statusChanged && !isDirty ? "button" : "submit"
                }
                onClick={
                  editWorkout && statusChanged && !isDirty
                    ? handleStatusOnlySave
                    : undefined
                }
                disabled={
                  loading || (editWorkout ? !isDirty && !statusChanged : false)
                }
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
