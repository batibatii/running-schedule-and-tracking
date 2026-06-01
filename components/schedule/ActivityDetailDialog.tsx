"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SportIcon } from "@/components/icons/SportIcon";
import { getSportDisplayName } from "@/lib/utils/workoutLabels";
import { formatDurationClock, minutesToPace } from "@/lib/utils/pace";
import type { StandaloneActivity } from "@/types/schedule";

interface ActivityDetailDialogProps {
  activity: StandaloneActivity | null;
  onOpenChange: (open: boolean) => void;
  onDelete?: (activityId: string) => Promise<void>;
}

export function ActivityDetailDialog({
  activity,
  onOpenChange,
  onDelete,
}: ActivityDetailDialogProps) {
  if (!activity) return null;

  return (
    <Dialog open={!!activity} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-105">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="bg-bg-soft inline-flex h-7 w-7 items-center justify-center rounded-full">
              <SportIcon sport={activity.sport} size={16} />
            </span>
            <DialogTitle className="text-base">
              {activity.title ?? getSportDisplayName(activity.sport)}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-2 gap-3">
          {activity.distance != null && activity.distance > 0 && (
            <StatBlock
              label="Distance"
              value={`${activity.distance.toFixed(2)} km`}
            />
          )}
          {activity.duration != null && activity.duration > 0 && (
            <StatBlock
              label="Duration"
              value={formatDurationClock(activity.duration)}
            />
          )}
          {activity.pace != null && (
            <StatBlock
              label="Pace"
              value={`${minutesToPace(activity.pace)} /km`}
            />
          )}
        </div>

        <p className="text-ink-faint mt-4 text-center text-[11px] tracking-wide">
          Synced from Strava
        </p>

        {onDelete && (
          <DialogFooter>
            <Button
              variant="destructive"
              size="sm"
              onClick={async () => {
                await onDelete(activity.id);
                onOpenChange(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-soft rounded-xl px-3 py-2.5">
      <p className="text-ink-faint text-[11px] font-medium tracking-wider uppercase">
        {label}
      </p>
      <p className="text-ink mt-0.5 font-mono text-sm font-semibold">{value}</p>
    </div>
  );
}
