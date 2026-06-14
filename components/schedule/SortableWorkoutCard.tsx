"use client";

import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

interface SortableWorkoutCardProps {
  id: string;
  isMergeAnimating?: boolean;
  children: React.ReactNode;
}
export function SortableWorkoutCard({
  id,
  isMergeAnimating,
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
    <motion.div
      ref={(node) => {
        setSortableRef(node);
        setDropRef(node);
      }}
      style={style}
      animate={isMergeAnimating ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={
        isMergeAnimating ? { duration: 0.35, ease: "easeOut" } : { duration: 0 }
      }
      {...listeners}
      {...attributes}
      className={
        isOver ? "ring-coral-deep/60 scale-[1.02] rounded-[18px] ring-2" : ""
      }
    >
      {children}
    </motion.div>
  );
}
