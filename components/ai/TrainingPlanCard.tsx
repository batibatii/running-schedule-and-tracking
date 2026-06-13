"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SportIcon } from "@/components/icons/SportIcon";
import { SPORT_ICON_BACKGROUND } from "@/lib/constants/ui";
import { getWorkoutTypeLabel, getZoneLabel } from "@/lib/utils/workoutLabels";
import {
  formatDateDisplay,
  getWeekStartDate,
  formatDateToISO,
} from "@/lib/utils/date";
import { SPORTS, WORKOUT_TYPES } from "@/types/workout";
import type {
  TrainingPlan,
  WeekPlan,
  PlannedDay,
} from "@/lib/ai/schemas/trainingPlan";
import type { DayOfWeek, HeartRateZone } from "@/types/workout";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEART_RATE_ZONES: HeartRateZone[] = [
  "zone-1",
  "zone-2",
  "zone-3",
  "zone-4",
  "zone-5",
];

const DAY_SHORT: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cycleNext<T>(items: readonly T[], current: T): T {
  const index = items.indexOf(current);
  return items[(index + 1) % items.length];
}

function formatWeekLabel(weekStartDate: string): string {
  const currentWeekMonday = formatDateToISO(getWeekStartDate(0));
  if (weekStartDate === currentWeekMonday) return "This week";
  const date = new Date(weekStartDate + "T00:00:00");
  return `Week of ${formatDateDisplay(date)}`;
}

function buildDayLabel(day: PlannedDay): string {
  const parts: string[] = [];
  if (day.distance) parts.push(`${day.distance} km`);
  if (day.workoutType) parts.push(getWorkoutTypeLabel(day.workoutType));
  return parts.join(" ") || "Workout";
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TrainingPlanCardProps {
  plan: TrainingPlan;
  onApply: (editedPlan: TrainingPlan) => void;
  onUndoPlan?: () => void;
  isApplying: boolean;
  isApplied: boolean;
  isUndone?: boolean;
}

// ---------------------------------------------------------------------------
// Inline distance editor
// ---------------------------------------------------------------------------

function InlineDistanceInput({
  value,
  onCommit,
}: {
  value: number;
  onCommit: (newValue: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function commit() {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed > 0) {
      onCommit(parsed);
    } else {
      onCommit(value);
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      className="bg-primary/10 text-foreground w-10 rounded px-1 text-center text-[13px] outline-none"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
        if (event.key === "Escape") onCommit(value);
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Editable day row
// ---------------------------------------------------------------------------

interface EditableDayRowProps {
  day: PlannedDay;
  isFirst: boolean;
  isEditable: boolean;
  onUpdate: (updated: PlannedDay) => void;
}

function EditableDayRow({
  day,
  isFirst,
  isEditable,
  onUpdate,
}: EditableDayRowProps) {
  const [editingDistance, setEditingDistance] = useState(false);

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

  function cycleSport() {
    if (!isEditable || !day.sport) return;
    onUpdate({ ...day, sport: cycleNext(SPORTS, day.sport) });
  }

  function cycleWorkoutType() {
    if (!isEditable || !day.workoutType) return;
    onUpdate({
      ...day,
      workoutType: cycleNext(WORKOUT_TYPES, day.workoutType),
    });
  }

  function cycleZone() {
    if (!isEditable || !day.heartRateZone) return;
    onUpdate({
      ...day,
      heartRateZone: cycleNext(HEART_RATE_ZONES, day.heartRateZone),
    });
  }

  function commitDistance(newDistance: number) {
    setEditingDistance(false);
    onUpdate({ ...day, distance: newDistance });
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
          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full ${SPORT_ICON_BACKGROUND[day.sport]} ${isEditable ? "cursor-pointer" : ""}`}
          onClick={cycleSport}
        >
          <SportIcon sport={day.sport} size={11} />
        </span>
      )}

      <span
        className={`text-foreground flex-1 text-[13px] ${isEditable ? "cursor-pointer" : ""}`}
        onClick={() => {
          if (!isEditable) return;
          if (day.distance && !editingDistance) {
            setEditingDistance(true);
          } else {
            cycleWorkoutType();
          }
        }}
      >
        {editingDistance && day.distance ? (
          <span className="inline-flex items-center gap-1">
            <InlineDistanceInput
              value={day.distance}
              onCommit={commitDistance}
            />
            <span>
              km {day.workoutType ? getWorkoutTypeLabel(day.workoutType) : ""}
            </span>
          </span>
        ) : (
          buildDayLabel(day)
        )}
      </span>

      {day.heartRateZone && (
        <span
          className={`bg-bg-soft border-line text-ink-soft ml-auto shrink-0 rounded-full border px-1.75 py-px font-mono text-[10px] font-semibold ${isEditable ? "cursor-pointer" : ""}`}
          onClick={cycleZone}
        >
          {getZoneLabel(day.heartRateZone)}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Week accordion section
// ---------------------------------------------------------------------------

interface WeekSectionProps {
  week: WeekPlan;
  weekIndex: number;
  isMultiWeek: boolean;
  isEditable: boolean;
  defaultExpanded: boolean;
  onUpdateDay: (weekIndex: number, dayIndex: number, day: PlannedDay) => void;
}

function WeekSection({
  week,
  weekIndex,
  isMultiWeek,
  isEditable,
  defaultExpanded,
  onUpdateDay,
}: WeekSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!isMultiWeek) {
    return (
      <div className="mb-3 flex flex-col">
        {week.days.map((day, dayIndex) => (
          <EditableDayRow
            key={day.dayOfWeek}
            day={day}
            isFirst={dayIndex === 0}
            isEditable={isEditable}
            onUpdate={(updated) => onUpdateDay(weekIndex, dayIndex, updated)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-auto w-full justify-start gap-1.5 px-0 py-1.5"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <ChevronDown
          className={`text-ink-faint size-3.5 transition-transform ${expanded ? "" : "-rotate-90"}`}
        />
        <span className="text-ink-soft text-[12px] font-semibold">
          {formatWeekLabel(week.weekStartDate)}
        </span>
      </Button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pb-1">
              {week.days.map((day, dayIndex) => (
                <EditableDayRow
                  key={day.dayOfWeek}
                  day={day}
                  isFirst={dayIndex === 0}
                  isEditable={isEditable}
                  onUpdate={(updated) =>
                    onUpdateDay(weekIndex, dayIndex, updated)
                  }
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main card
// ---------------------------------------------------------------------------

export function TrainingPlanCard({
  plan,
  onApply,
  onUndoPlan,
  isApplying,
  isApplied,
  isUndone,
}: TrainingPlanCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const [editedWeeks, setEditedWeeks] = useState(plan.weeks);

  const isMultiWeek = plan.weeks.length > 1;
  const isEditable = !isApplying && !isApplied && !isUndone;

  const weekCountLabel = isMultiWeek
    ? `${plan.weeks.length} weeks`
    : formatWeekLabel(plan.weeks[0].weekStartDate);

  function handleUpdateDay(
    weekIndex: number,
    dayIndex: number,
    updatedDay: PlannedDay,
  ) {
    setEditedWeeks((prev) => {
      const next = [...prev];
      const weekDays = [...next[weekIndex].days];
      weekDays[dayIndex] = updatedDay;
      next[weekIndex] = { ...next[weekIndex], days: weekDays };
      return next;
    });
  }

  function handleApply() {
    onApply({ ...plan, weeks: editedWeeks });
  }

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 0.9, 0.32, 1] }}
      className="border-line-strong bg-background rounded-[18px] border border-dashed p-3.5 pb-3"
      style={{ maxWidth: "96%" }}
    >
      {/* Header */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-primary inline-flex">
          <Sparkles className="size-3.5" />
        </span>
        <span className="font-display flex-1 text-[17px]">
          {isMultiWeek ? "Training plan" : "Suggested training plan"}
        </span>
        <span className="text-ink-faint text-[10px] tracking-[0.08em] uppercase">
          {weekCountLabel}
        </span>
      </div>

      {/* Week sections */}
      {editedWeeks.map((week, weekIndex) => (
        <WeekSection
          key={week.weekStartDate}
          week={week}
          weekIndex={weekIndex}
          isMultiWeek={isMultiWeek}
          isEditable={isEditable}
          defaultExpanded={plan.weeks.length <= 4}
          onUpdateDay={handleUpdateDay}
        />
      ))}

      {/* Actions */}
      <div className="flex gap-2">
        {isUndone ? (
          <Button size="sm" variant="outline" disabled>
            Plan removed
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isApplying || isApplied}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={
                    isApplied ? "applied" : isApplying ? "applying" : "apply"
                  }
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

            {isApplied && onUndoPlan && (
              <Button variant="outline" size="sm" onClick={onUndoPlan}>
                Undo
              </Button>
            )}

            {!isApplied && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissed(true)}
                disabled={isApplying}
              >
                Dismiss
              </Button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
