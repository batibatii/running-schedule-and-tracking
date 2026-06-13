"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
  Sport,
  WorkoutType,
  HeartRateZone,
  DayOfWeek,
} from "@/types/workout";
import { SportIcon } from "@/components/icons/SportIcon";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";
import {
  SPORT_ICON_BACKGROUND,
  WORKOUT_TYPE_FOREGROUND,
} from "@/lib/constants/ui";

interface WorkoutPreviewCardProps {
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance: number;
  duration?: number;
  pace?: string;
  dayOfWeek: DayOfWeek;
  title?: string;
  onUndo?: () => Promise<boolean>;
  /** True when the workout no longer exists (deleted externally). */
  gone?: boolean;
}

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function WorkoutPreviewCard({
  sport,
  workoutType,
  heartRateZone,
  distance,
  dayOfWeek,
  onUndo,
  gone = false,
}: WorkoutPreviewCardProps) {
  const [undone, setUndone] = useState(false);
  // Initialized once at mount — the card is always active when first rendered
  // (it's only shown immediately after a workout is created). gone only ever
  // transitions false → true, so we never need to re-detect activation.
  const [wasActive] = useState(!gone);

  const faded = undone || (wasActive && gone);

  async function handleUndo() {
    if (!onUndo || faded) return;
    const success = await onUndo();
    if (success) setUndone(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: faded ? 0.5 : 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-line-strong bg-background rounded-[18px] border border-dashed p-3.5"
      style={{ maxWidth: "94%" }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full ${SPORT_ICON_BACKGROUND[sport]}`}
        >
          <SportIcon sport={sport} size={13} />
        </span>
        <span className="text-[13.5px] font-semibold">
          {getSportLabel(sport)}
        </span>
        <span className="text-ink-faint">&middot;</span>
        <span
          className={`font-display text-[14px] italic ${WORKOUT_TYPE_FOREGROUND[workoutType]}`}
        >
          {getWorkoutTypeLabel(workoutType)}
        </span>
        <span
          className={`ml-auto rounded-full px-2 py-px text-[10px] font-semibold ${getZoneColor(heartRateZone)}`}
        >
          {getZoneLabel(heartRateZone)}
        </span>
      </div>

      {/* Stats + Undo */}
      <div className="mt-1 flex items-center justify-between">
        <span className="text-ink-soft font-mono text-[12.5px]">
          {distance > 0 && <>{distance} km &middot; </>}
          {DAY_LABELS[dayOfWeek]}
        </span>
        {onUndo && !faded && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleUndo}
            className="text-ink-faint hover:text-destructive gap-1 text-[11px]"
          >
            <Undo2 className="size-3" />
            Undo
          </Button>
        )}
        {faded && (
          <span className="text-ink-faint text-[11px] italic">Removed</span>
        )}
      </div>
    </motion.div>
  );
}
