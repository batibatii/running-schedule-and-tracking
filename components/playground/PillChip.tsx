"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Pill } from "@/types/playground";
import { PILL_COLORS } from "@/lib/constants/ui";

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
