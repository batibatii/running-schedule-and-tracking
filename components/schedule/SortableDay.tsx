"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DayOfWeek } from "@/types/workout";
import { GripVertical } from "lucide-react";

interface InsertionIndicatorProps {
  day: DayOfWeek;
  index: number;
}

/**
 * Visible droppable zone between workout cards during cross-day drag.
 * Thin line with dots at each end — expands on hover.
 */
function InsertionIndicator({ day, index }: InsertionIndicatorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `gap-${day}-${index}`,
    data: { type: "day", day, index },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center transition-all duration-150 ${
        isOver ? "my-0.5 min-h-6" : "min-h-3"
      }`}
    >
      <div
        className={`flex w-full items-center gap-0.5 ${
          isOver ? "opacity-100" : "opacity-40"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOver ? "bg-coral-deep" : "bg-ink-faint"}`}
        />
        <span
          className={`h-0.5 flex-1 rounded-full ${isOver ? "bg-coral-deep" : "bg-line-strong"}`}
        />
        <span
          className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOver ? "bg-coral-deep" : "bg-ink-faint"}`}
        />
      </div>
    </div>
  );
}

interface SortableDayProps {
  day: DayOfWeek;
  workoutIds: string[];
  showInsertionSlots: boolean;
  /** True when the day has no workouts AND no activities — shows empty drop zone */
  isEmpty: boolean;
  /** True when any drag operation is in progress */
  isDragActive: boolean;
  children: React.ReactNode;
}

export function SortableDay({
  day,
  workoutIds,
  showInsertionSlots,
  isEmpty,
  isDragActive,
  children,
}: SortableDayProps) {
  // Day-level droppable — catch-all for drops anywhere in the column
  const { setNodeRef: setDayRef, isOver: isDayOver } = useDroppable({
    id: day,
    data: { type: "day", day },
  });

  if (isEmpty) {
    return (
      <SortableContext
        items={workoutIds}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setDayRef}
          className={`flex min-h-15 flex-1 items-center justify-center rounded-2xl border border-dashed transition-colors ${
            isDayOver
              ? "border-coral-deep/40 bg-mint/20"
              : "border-line-strong text-ink-faint"
          }`}
        >
          {isDragActive ? (
            <span className="text-ink-faint animate-in fade-in text-[11px] duration-200">
              Drop here
            </span>
          ) : (
            <GripVertical
              size={25}
              strokeWidth={1.5}
              className="text-ink-faint/30"
            />
          )}
        </div>
      </SortableContext>
    );
  }

  return (
    <SortableContext items={workoutIds} strategy={verticalListSortingStrategy}>
      <div ref={setDayRef} className="flex flex-1 flex-col gap-1">
        {showInsertionSlots ? (
          <>
            {React.Children.map(children, (child, childIndex) => (
              <React.Fragment key={workoutIds[childIndex] ?? childIndex}>
                <InsertionIndicator day={day} index={childIndex} />
                {child}
              </React.Fragment>
            ))}
            <InsertionIndicator day={day} index={workoutIds.length} />
          </>
        ) : (
          children
        )}
      </div>
    </SortableContext>
  );
}
