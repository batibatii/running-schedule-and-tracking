"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableWorkoutCardProps {
  id: string;
  children: React.ReactNode;
}
export function SortableWorkoutCard({
  id,
  children,
}: SortableWorkoutCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    data: { type: "workout", workoutId: id },
  });

  // Nested droppable for pill-merge (dropping a pill/preset onto the card)
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `workout-drop-${id}`,
    data: { type: "workout-card", workoutId: id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab" as const,
  };

  return (
    <div
      ref={(node) => {
        setSortableRef(node);
        setDropRef(node);
      }}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-all duration-150 ${isOver ? "ring-coral-deep/60 scale-[1.02] rounded-[18px] ring-2" : ""}`}
    >
      {children}
    </div>
  );
}
