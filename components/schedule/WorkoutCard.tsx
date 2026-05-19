"use client";

import { WorkoutType, HeartRateZone, Sport } from "@/types/workout";
import { formatDurationClock } from "@/lib/utils/pace";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";
import { SportIcon } from "@/components/icons/SportIcon";
import { WORKOUT_TYPE_ICON_BACKGROUND } from "@/lib/constants/ui";

interface WorkoutCardProps {
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance: number;
  duration?: number;
  title?: string;
  notes?: string;
  completed?: boolean;
  onClick?: () => void;
}

export function WorkoutCard({
  sport,
  workoutType,
  heartRateZone,
  distance,
  duration,
  completed,
  onClick,
}: WorkoutCardProps) {
  return (
    <button
      onClick={onClick}
      className="group border-line bg-surface relative block w-full cursor-pointer rounded-[18px] border p-3 text-left transition-all hover:-translate-y-px hover:shadow-(--shadow-sm)"
    >
      {/* Status indicator — top right corner */}
      {completed ? (
        <span
          title="Completed"
          className="bg-mint-deep absolute top-2.5 right-2.5 inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-white"
        >
          <svg
            viewBox="0 0 24 24"
            width={11}
            height={11}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12l5 5 9-11" />
          </svg>
        </span>
      ) : (
        <span className="text-ink-faint absolute top-2.5 right-2.5 text-[10px] tracking-[0.06em] uppercase">
          planned
        </span>
      )}

      {/* Header row */}
      <div className="mt-4 mb-1.5 flex items-center gap-1.5">
        <span
          className={`inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full ${WORKOUT_TYPE_ICON_BACKGROUND[workoutType]}`}
        >
          <SportIcon sport={sport} size={12} />
        </span>
        <span className="text-[13px] font-semibold">
          {getSportLabel(sport)} &middot; {getWorkoutTypeLabel(workoutType)}
        </span>
      </div>

      {/* Stats row */}
      <div className="text-ink-soft flex items-center gap-2.5 font-mono text-xs">
        {distance > 0 && <span>{distance} km</span>}
        {duration != null && duration > 0 && (
          <span>{formatDurationClock(duration)}</span>
        )}
        <span
          className={`ml-auto rounded-full px-1.75 py-px text-[10px] font-semibold ${getZoneColor(heartRateZone)}`}
        >
          {getZoneLabel(heartRateZone)}
        </span>
      </div>
    </button>
  );
}
