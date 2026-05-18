"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";

interface DroppableWorkoutCardProps {
  id: string;
  children: React.ReactNode;
}

export function DroppableWorkoutCard({
  id,
  children,
}: DroppableWorkoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id,
    data: { type: "workout", workoutId: id },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `workout-drop-${id}`,
    data: { type: "workout-card", workoutId: id },
  });

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className={`transition-all duration-150 ${isOver ? "ring-coral-deep/60 scale-[1.02] rounded-[18px] ring-2" : ""}`}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
    >
      {children}
    </div>
  );
}
