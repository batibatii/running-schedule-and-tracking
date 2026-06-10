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
  dayOfWeek,
}: WorkoutPreviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="border-line-strong bg-background rounded-[18px] border border-dashed p-3.5"
      style={{ maxWidth: "94%" }}
    >
      <div className="mb-1 flex items-center gap-2">
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

      {/* Stats line: "10 km · Wednesday" */}
      <div className="text-ink-soft mb-3 font-mono text-[12.5px]">
        {distance > 0 && <span>{distance} km</span>}
        {distance > 0 && <span> · </span>}
        {DAY_LABELS[dayOfWeek]}
      </div>

      <div className="flex gap-2">
        <Button icon={null} label="Add to schedule" />
        <ButtonGhost label="Add to playground" />
        <ButtonGhost label="Edit" />
      </div>
    </motion.div>
  );
}

function Button({ label }: { icon: React.ReactNode | null; label: string }) {
  return (
    <button
      className="bg-primary text-primary-foreground inline-flex items-center gap-1.5 rounded-full border-none px-3.5 py-1.75 text-[12.5px] font-semibold shadow-xs"
      type="button"
    >
      {label}
    </button>
  );
}

function ButtonGhost({ label }: { label: string }) {
  return (
    <button
      className="border-line bg-surface text-ink-soft hover:bg-bg-soft inline-flex items-center rounded-full border px-3.5 py-1.75 text-[12.5px] font-medium transition-colors"
      type="button"
    >
      {label}
    </button>
  );
}
