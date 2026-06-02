"use client";

import { WorkoutType, HeartRateZone, Sport } from "@/types/workout";
import { formatDurationClock, minutesToPace } from "@/lib/utils/pace";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";
import { SportIcon } from "@/components/icons/SportIcon";
import { Button } from "@/components/ui/button";
import {
  SPORT_ICON_BACKGROUND,
  WORKOUT_TYPE_FOREGROUND,
} from "@/lib/constants/ui";

interface PlannedCardProps {
  kind: "planned";
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance: number;
  duration?: number;
  title?: string;
  notes?: string;
  completed?: boolean;
  syncStatus?: "strava" | "manual" | null;
  actualDistance?: number | null;
  actualDuration?: number | null;
  onClick?: () => void;
}

interface ActivityCardProps {
  kind: "activity";
  sport: Sport;
  title?: string;
  distance?: number | null;
  duration?: number | null; // minutes
  pace?: number | null; // decimal min/km — formatted in-component
  onClick?: () => void;
}

type WorkoutCardProps = PlannedCardProps | ActivityCardProps;

const CARD_BASE_CLASSES =
  "group relative block h-auto w-full cursor-pointer rounded-[18px] border p-3 text-left whitespace-normal transition-all hover:-translate-y-px hover:shadow-(--shadow-sm)";

export function WorkoutCard(props: WorkoutCardProps) {
  if (props.kind === "activity") {
    return <StandaloneActivityCard {...props} />;
  }
  return <PlannedWorkoutCard {...props} />;
}

// ---------------------------------------------------------------------------
// Planned workout card
// ---------------------------------------------------------------------------

function PlannedWorkoutCard({
  sport,
  workoutType,
  heartRateZone,
  distance,
  duration,
  completed,
  syncStatus,
  actualDistance,
  actualDuration,
  onClick,
}: PlannedCardProps) {
  // Derive display state from completed + syncStatus
  const isStravaSynced = syncStatus === "strava";
  const showAsCompleted = completed;
  const showAsMissed = !completed && syncStatus != null;

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`${CARD_BASE_CLASSES} border-line bg-surface`}
    >
      {/* Status indicator — top right corner */}
      {showAsCompleted ? (
        <span className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {isStravaSynced && (
            <span className="text-mint-deep text-[10px] font-semibold tracking-[0.06em] uppercase">
              synced
            </span>
          )}
          <span
            title={isStravaSynced ? "Synced from Strava" : "Completed"}
            className="bg-mint-deep inline-flex h-4.5 w-4.5 items-center justify-center rounded-full text-white"
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
        </span>
      ) : showAsMissed ? (
        <span
          title="Missed"
          className="bg-butter absolute top-2.5 right-2.5 rounded-full px-1.5 py-px text-[10px] font-semibold tracking-[0.06em] text-[#705220] uppercase"
        >
          missed
        </span>
      ) : (
        <span className="text-ink-faint absolute top-2.5 right-2.5 text-[10px] tracking-[0.06em] uppercase">
          planned
        </span>
      )}

      {/* Sport · italic workout type */}
      <div className="mt-4 mb-2 flex items-baseline gap-1.5">
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

      {/* Stats row — show actual / planned when Strava data is present */}
      <div className="text-ink-soft flex items-center gap-2.5 font-mono text-xs">
        {distance > 0 && (
          <span>
            {actualDistance != null ? (
              <>
                <span className="text-ink">{actualDistance.toFixed(1)}</span>
                <span className="text-ink-faint"> / {distance} km</span>
              </>
            ) : (
              `${distance} km`
            )}
          </span>
        )}
        {actualDuration != null ? (
          <span className="text-ink">
            {formatDurationClock(actualDuration)}
          </span>
        ) : (
          duration != null &&
          duration > 0 && <span>{formatDurationClock(duration)}</span>
        )}
        <span
          className={`ml-auto rounded-full px-1.75 py-px text-[10px] font-semibold ${getZoneColor(heartRateZone)}`}
        >
          {getZoneLabel(heartRateZone)}
        </span>
      </div>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Standalone Strava activity card (unmatched — no planned workout)
// ---------------------------------------------------------------------------

function StandaloneActivityCard({
  sport,
  title,
  distance,
  duration,
  onClick,
}: ActivityCardProps) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`${CARD_BASE_CLASSES} bg-surface border-l-[3px] border-[#FC4C02]/25 border-l-[#FC4C02]`}
    >
      {/* Strava badge — top right */}
      <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold tracking-[0.06em] text-[#FC4C02] uppercase">
        Strava
      </span>

      {/* Sport icon + title */}
      <div className="mt-4 mb-2 flex items-center gap-1.5">
        <span className="bg-bg-soft inline-flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full">
          <SportIcon sport={sport} size={12} />
        </span>
        <span className="text-ink line-clamp-1 text-[13px] font-semibold">
          {title ?? getSportLabel(sport)}
        </span>
      </div>

      {/* Stats row */}
      <div className="text-ink-soft flex items-center gap-2.5 font-mono text-xs">
        {distance != null && distance > 0 && (
          <span>{distance.toFixed(1)} km</span>
        )}
        {duration != null && duration > 0 && (
          <span>{formatDurationClock(duration)}</span>
        )}
      </div>
    </Button>
  );
}
