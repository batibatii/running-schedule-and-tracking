"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WorkoutType, HeartRateZone } from "@/types/workout";
import { formatDuration } from "@/lib/utils/pace";

interface WorkoutCardProps {
  id: string;
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

function getZoneColor(zone: HeartRateZone): string {
  const colors: Record<HeartRateZone, string> = {
    "zone-1": "bg-cyan-100 text-cyan-800",
    "zone-2": "bg-green-100 text-green-800",
    "zone-3": "bg-yellow-100 text-yellow-800",
    "zone-4": "bg-orange-100 text-orange-800",
    "zone-5": "bg-red-100 text-red-800",
  };
  return colors[zone];
}

function getWorkoutTypeLabel(type: WorkoutType): string {
  const labels: Record<WorkoutType, string> = {
    easy: "Easy Run",
    tempo: "Tempo",
    interval: "Intervals",
    long: "Long Run",
    recovery: "Recovery Run",
    race: "Race",
  };
  return labels[type];
}

function getZoneLabel(zone: HeartRateZone): string {
  const labels: Record<HeartRateZone, string> = {
    "zone-1": "Z1",
    "zone-2": "Z2",
    "zone-3": "Z3",
    "zone-4": "Z4",
    "zone-5": "Z5",
  };
  return labels[zone];
}

export function WorkoutCard({
  id,
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
            {getWorkoutTypeLabel(workoutType)}
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
