"use client";

import { useDraggable } from "@dnd-kit/core";
import { Pill, PillFieldType } from "@/types/playground";

const PILL_COLORS: Record<PillFieldType, string> = {
  sport: "bg-blue-100 text-blue-800 border-blue-200",
  workoutType: "bg-purple-100 text-purple-800 border-purple-200",
  heartRateZone: "bg-orange-100 text-orange-800 border-orange-200",
  distance: "bg-green-100 text-green-800 border-green-200",
  pace: "bg-amber-100 text-amber-800 border-amber-200",
};

interface PillChipProps {
  pill: Pill;
  isOverlay?: boolean;
}

export function PillChip({ pill, isOverlay = false }: PillChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pill.id,
    data: { type: "pill", pill },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        inline-flex items-center px-3 py-1 rounded-full
        border text-sm font-medium select-none
        transition-all
        ${PILL_COLORS[pill.fieldType]}
        ${isDragging && !isOverlay ? "opacity-40" : ""}
        ${isOverlay ? "shadow-lg cursor-grabbing" : "cursor-grab hover:shadow-sm"}
      `}
    >
      {pill.label}
    </div>
  );
}
