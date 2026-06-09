"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrainingPlan, PlannedDay } from "@/lib/ai/schemas/trainingPlan";
import type { DayOfWeek } from "@/types/workout";
import { getWorkoutTypeLabel, getZoneLabel } from "@/lib/utils/workoutLabels";

interface TrainingPlanCardProps {
  plan: TrainingPlan;
  onApply: () => void;
  onDismiss: () => void;
  isApplying: boolean;
  isApplied: boolean;
}

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function DayRow({ day }: { day: PlannedDay }) {
  if (day.isRest) {
    return (
      <div className="flex items-center gap-3 py-1">
        <span className="text-muted-foreground w-8 shrink-0 text-xs font-medium">
          {DAY_SHORT[day.dayOfWeek]}
        </span>
        <span className="text-muted-foreground text-xs italic">Rest</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-muted-foreground w-8 shrink-0 text-xs font-medium">
        {DAY_SHORT[day.dayOfWeek]}
      </span>
      <span className="text-foreground/90 flex-1 text-xs">
        {day.distance && <span className="font-mono">{day.distance} km</span>}
        {day.workoutType && (
          <>
            <span className="text-ink-faint"> · </span>
            <span className="font-display italic">
              {getWorkoutTypeLabel(day.workoutType)}
            </span>
          </>
        )}
        {day.heartRateZone && (
          <>
            <span className="text-ink-faint"> · </span>
            <span className="font-mono">{getZoneLabel(day.heartRateZone)}</span>
          </>
        )}
      </span>
    </div>
  );
}

export function TrainingPlanCard({
  plan,
  onApply,
  onDismiss,
  isApplying,
  isApplied,
}: TrainingPlanCardProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 0.9, 0.32, 1] }}
      className="border-line bg-surface rounded-2xl border p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full">
          <Sparkles className="size-3" />
        </span>
        <span className="text-sm font-semibold">Suggested Training Plan</span>
      </div>

      {/* 7-day grid */}
      <div className="divide-line/50 mb-3 divide-y">
        {plan.days.map((day) => (
          <DayRow key={day.dayOfWeek} day={day} />
        ))}
      </div>

      {/* Totals */}
      <p className="text-muted-foreground mb-4 font-mono text-xs">
        Total: {plan.totalDistance} km · {plan.totalSessions} sessions
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" onClick={onApply} disabled={isApplying || isApplied}>
          <AnimatePresence mode="wait">
            <motion.span
              key={isApplied ? "applied" : isApplying ? "applying" : "apply"}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {isApplied
                ? "Applied \u2713"
                : isApplying
                  ? "Applying..."
                  : "Apply to schedule"}
            </motion.span>
          </AnimatePresence>
        </Button>

        {!isApplied && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDismissed(true);
              onDismiss();
            }}
            disabled={isApplying}
          >
            Dismiss
          </Button>
        )}
      </div>
    </motion.div>
  );
}
