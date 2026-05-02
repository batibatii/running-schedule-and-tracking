"use client";

import { useDroppable } from "@dnd-kit/core";
import { DayOfWeek } from "@/types/workout";

interface DroppableDayProps {
  day: DayOfWeek;
  children: React.ReactNode;
}

export function DroppableDay({ day, children }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: day,
    data: { type: "day", day },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col rounded-md transition-colors ${isOver ? "bg-chart-2/20" : ""}`}
    >
      {children}
    </div>
  );
}
