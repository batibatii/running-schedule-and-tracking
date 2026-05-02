"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WorkoutType, HeartRateZone, Sport } from "@/types/workout";
import { formatDuration } from "@/lib/utils/pace";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";

interface WorkoutCardProps {
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance: number;
  duration?: number;
  title?: string;
  notes?: string;
  onClick?: () => void;
}

export function WorkoutCard({
  sport,
  workoutType,
  heartRateZone,
  distance,
  duration,
  title,
  notes,
  onClick,
}: WorkoutCardProps) {
  return (
    <Card
      className="h-25 cursor-pointer transition-shadow hover:shadow-md"
      onClick={onClick}
    >
      <CardContent className="h-full space-y-1.5 overflow-y-auto p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {getSportLabel(sport)} · {getWorkoutTypeLabel(workoutType)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${getZoneColor(heartRateZone)}`}
          >
            {getZoneLabel(heartRateZone)}
          </span>
        </div>

        {title && (
          <p className="text-muted-foreground truncate text-sm">{title}</p>
        )}

        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span>{distance} km</span>
          {duration && <span>{formatDuration(duration)}</span>}
        </div>

        {notes && <p className="text-muted-foreground text-xs">{notes}</p>}
      </CardContent>
    </Card>
  );
}
