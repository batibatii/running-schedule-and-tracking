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
  id: string;
  sport: Sport;
  workoutType: WorkoutType;
  heartRateZone: HeartRateZone;
  distance: number;
  duration?: number;
  title?: string;
  notes?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
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
      className="cursor-pointer hover:shadow-md transition-shadow h-25"
      onClick={onClick}
    >
      <CardContent className="p-2.5 space-y-1.5 h-full overflow-y-auto">
        {/* Header: Type and Zone Badge */}
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">
            {getSportLabel(sport)} · {getWorkoutTypeLabel(workoutType)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${getZoneColor(heartRateZone)}`}
          >
            {getZoneLabel(heartRateZone)}
          </span>
        </div>

        {title && (
          <p className="text-sm text-muted-foreground truncate">{title}</p>
        )}

        {/* Metrics: Distance and Duration */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{distance} km</span>
          {duration && <span>{formatDuration(duration)}</span>}
        </div>

        {notes && (
          <p className="text-xs text-muted-foreground">{notes}</p>
        )}
      </CardContent>
    </Card>
  );
}
