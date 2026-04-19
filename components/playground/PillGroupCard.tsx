"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { PillGroup } from "@/types/playground";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";

interface PillGroupCardProps {
  group: PillGroup;
  isOverlay?: boolean;
}

export function PillGroupCard({
  group,
  isOverlay = false,
}: PillGroupCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: group.id,
    data: { type: "group", group },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: { type: "group-card", groupId: group.id },
  });

  const { fields } = group;

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className={`
        rounded-lg border border-pink-200 bg-pink-50/60
        p-2 space-y-1 select-none
        transition-all min-w-30
        ${isDragging && !isOverlay ? "opacity-40" : ""}
        ${isOverlay ? "shadow-lg cursor-grabbing" : "cursor-grab hover:shadow-sm"}
        ${isOver ? "ring-2 ring-pink-400/60" : ""}
      `}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-xs truncate">
          {fields.sport ? getSportLabel(fields.sport) : "—"}
          {fields.workoutType &&
            ` · ${getWorkoutTypeLabel(fields.workoutType)}`}
        </span>
        {fields.heartRateZone && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${getZoneColor(fields.heartRateZone)}`}
          >
            {getZoneLabel(fields.heartRateZone)}
          </span>
        )}
      </div>

      {(fields.distance || fields.pace) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {fields.distance && <span>{fields.distance} km</span>}
          {fields.pace && <span>{fields.pace} /km</span>}
        </div>
      )}

      <div className="text-[10px] text-pink-400">
        {group.pills.length} pill{group.pills.length !== 1 && "s"}
      </div>
    </div>
  );
}
