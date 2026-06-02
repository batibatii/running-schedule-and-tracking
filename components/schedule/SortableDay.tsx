"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DayOfWeek } from "@/types/workout";

interface InsertionIndicatorProps {
  day: DayOfWeek;
  index: number;
}

/**
 * Visible droppable zone between workout cards during active drag.
 * Always rendered with enough height to be a valid drop target.
 */
function InsertionIndicator({ day, index }: InsertionIndicatorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `gap-${day}-${index}`,
    data: { type: "day", day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex items-center justify-center rounded-xl border border-dashed transition-all duration-150 ${
        isOver
          ? "border-coral-deep/40 bg-mint/20 min-h-8"
          : "border-line min-h-5"
      }`}
    >
      <span
        className={`text-[10px] ${isOver ? "text-coral-deep" : "text-ink-faint"}`}
      >
        Drop here
      </span>
    </div>
  );
}

interface SortableDayProps {
  day: DayOfWeek;
  workoutIds: string[];
  isDragActive: boolean;
  children: React.ReactNode;
}

export function SortableDay({
  day,
  workoutIds,
  isDragActive,
  children,
}: SortableDayProps) {
  const hasWorkouts = workoutIds.length > 0;

  // Day-level droppable — catch-all for drops anywhere in the column
  const { setNodeRef: setDayRef, isOver: isDayOver } = useDroppable({
    id: day,
    data: { type: "day", day },
  });

  if (!hasWorkouts) {
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
          <span className="text-ink-faint text-[11px]">Drop here</span>
        </div>
      </SortableContext>
    );
  }

  // Day with workouts — interleave insertion indicators between cards
  const childArray = React.Children.toArray(children);

  return (
    <SortableContext items={workoutIds} strategy={verticalListSortingStrategy}>
      <div ref={setDayRef} className="flex flex-1 flex-col gap-1">
        {isDragActive ? (
          <>
            {childArray.map((child, childIndex) => (
              <React.Fragment key={childIndex}>
                <InsertionIndicator day={day} index={childIndex} />
                {child}
              </React.Fragment>
            ))}
            <InsertionIndicator day={day} index={childArray.length} />
          </>
        ) : (
          childArray
        )}
      </div>
    </SortableContext>
  );
}
