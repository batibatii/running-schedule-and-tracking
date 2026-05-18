"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Pill, PillFieldType } from "@/types/playground";

export const PILL_COLORS: Record<PillFieldType, string> = {
  sport: "bg-[#E5F2FB] text-[#2A5573] border-[#C9DFEF]",
  workoutType: "bg-[#EDE3FB] text-[#48356E] border-[#D9C7F0]",
  heartRateZone: "bg-[#FFE5D6] text-[#7A4525] border-[#F7CFB4]",
  distance: "bg-[#DCF1E5] text-[#2D5840] border-[#BEE2CC]",
  pace: "bg-[#FFEFC8] text-[#705220] border-[#F2DDA0]",
};

interface PillChipProps {
  pill: Pill;
  isOverlay?: boolean;
  isMergeTarget?: boolean;
}

export function PillChip({
  pill,
  isOverlay = false,
  isMergeTarget = false,
}: PillChipProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: pill.id,
    data: { type: "pill", pill },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `pill-drop-${pill.id}`,
    data: { type: "pill-target", pillId: pill.id, pill },
    disabled: !isMergeTarget,
  });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className={`inline-flex flex-none items-center rounded-full border px-3 py-1 text-sm font-medium transition-all select-none ${PILL_COLORS[pill.fieldType]} ${isDragging && !isOverlay ? "opacity-40" : ""} ${isOverlay ? "cursor-grabbing shadow-lg" : "cursor-grab hover:shadow-sm"} ${isOver ? "ring-2 ring-pink-400/60" : ""} `}
    >
      {pill.label}
    </div>
  );
}
