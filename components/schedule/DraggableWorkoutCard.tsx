"use client";

import { useDraggable } from "@dnd-kit/core";

interface DraggableWorkoutCardProps {
  id: string;
  children: React.ReactNode;
}

export function DraggableWorkoutCard({
  id,
  children,
}: DraggableWorkoutCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "workout", workoutId: id },
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
