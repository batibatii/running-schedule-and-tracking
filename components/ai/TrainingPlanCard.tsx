"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SportIcon } from "@/components/icons/SportIcon";
import { SPORT_ICON_BACKGROUND } from "@/lib/constants/ui";
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

function buildDayLabel(day: PlannedDay): string {
  const parts: string[] = [];
  if (day.distance) parts.push(`${day.distance} km`);
  if (day.workoutType) parts.push(getWorkoutTypeLabel(day.workoutType));
  return parts.join(" ") || "Workout";
}

function DayRow({ day, isFirst }: { day: PlannedDay; isFirst: boolean }) {
  if (day.isRest) {
    return (
      <div
        className={`flex items-center gap-2.5 py-1.75 ${!isFirst ? "border-line border-t" : ""}`}
      >
        <span className="text-ink-faint w-8 shrink-0 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase">
          {DAY_SHORT[day.dayOfWeek]}
        </span>
        <span className="text-ink-faint text-[13px]">Rest</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2.5 py-1.75 ${!isFirst ? "border-line border-t" : ""}`}
    >
      <span className="text-ink-faint w-8 shrink-0 font-mono text-[11px] font-semibold tracking-[0.04em] uppercase">
        {DAY_SHORT[day.dayOfWeek]}
      </span>

      {day.sport && (
        <span
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${SPORT_ICON_BACKGROUND[day.sport]}`}
        >
          <SportIcon sport={day.sport} size={11} />
        </span>
      )}

      <span className="text-foreground flex-1 text-[13px]">
        {buildDayLabel(day)}
      </span>

      {day.heartRateZone && (
        <span className="bg-bg-soft border-line text-ink-soft ml-auto shrink-0 rounded-full border px-1.75 py-px font-mono text-[10px] font-semibold">
          {getZoneLabel(day.heartRateZone)}
        </span>
      )}
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
      className="border-line-strong bg-background rounded-[18px] border border-dashed p-3.5 pb-3"
      style={{ maxWidth: "96%" }}
    >
      {/* Header — sparkle (bare) + Instrument Serif title + "7 days" label */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-primary inline-flex">
          <Sparkles className="size-3.5" />
        </span>
        <span className="font-display flex-1 text-[17px]">
          Suggested training plan
        </span>
        <span className="text-ink-faint text-[10px] tracking-[0.08em] uppercase">
          7 days
        </span>
      </div>

      {/* 7-day grid */}
      <div className="mb-3 flex flex-col">
        {plan.days.map((day, index) => (
          <DayRow key={day.dayOfWeek} day={day} isFirst={index === 0} />
        ))}
      </div>

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
            variant="outline"
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
