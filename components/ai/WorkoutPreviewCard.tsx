"use client";

import { motion } from "framer-motion";
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
  duration,
  pace,
  dayOfWeek,
}: WorkoutPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-line bg-surface rounded-2xl border p-3"
    >
      {/* Sport · italic workout type */}
      <div className="mb-1.5 flex items-baseline gap-1.5">
        <span
          className={`inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center self-center rounded-full ${SPORT_ICON_BACKGROUND[sport]}`}
        >
          <SportIcon sport={sport} size={12} />
        </span>
        <span className="text-[13px] font-semibold">
          {getSportLabel(sport)}
        </span>
        <span className="text-ink-faint text-[13px]">&middot;</span>
        <span
          className={`font-display text-[13px] leading-[1.2] tracking-[-0.005em] italic ${WORKOUT_TYPE_FOREGROUND[workoutType]}`}
        >
          {getWorkoutTypeLabel(workoutType)}
        </span>
      </div>

      {/* Stats row */}
      <div className="text-ink-soft flex items-center gap-2.5 font-mono text-xs">
        {distance > 0 && <span>{distance} km</span>}
        {duration != null && duration > 0 && <span>{duration} min</span>}
        {pace && <span>{pace}/km</span>}
        <span
          className={`ml-auto rounded-full px-1.75 py-px text-[10px] font-semibold ${getZoneColor(heartRateZone)}`}
        >
          {getZoneLabel(heartRateZone)}
        </span>
      </div>

      {/* Confirmation line */}
      <p className="text-muted-foreground mt-2 text-[11px]">
        Added to{" "}
        <span className="text-foreground/70 font-medium">
          {DAY_LABELS[dayOfWeek]}
        </span>
      </p>
    </motion.div>
  );
}
