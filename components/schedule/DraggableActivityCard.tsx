"use client";

import { useDraggable } from "@dnd-kit/core";

interface DraggableActivityCardProps {
  activityId: string;
  children: React.ReactNode;
}

export function DraggableActivityCard({
  activityId,
  children,
}: DraggableActivityCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `activity-${activityId}`,
    data: { type: "activity", activityId },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      {children}
    </div>
  );
}
