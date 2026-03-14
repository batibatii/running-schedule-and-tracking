"use client";

import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

interface TrashBinProps {
  isDragActive: boolean;
}

export function TrashBin({ isDragActive }: TrashBinProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "trash",
    data: { type: "trash" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex items-center justify-center
        rounded-lg border-2 border-dashed
        transition-all duration-200
        ${
          isDragActive
            ? isOver
              ? "border-destructive bg-destructive/15 scale-110 shadow-md"
              : "border-muted-foreground/40 bg-muted/50"
            : "border-transparent opacity-40"
        }
        w-14 h-14
      `}
    >
      <Trash2
        className={`
          transition-all duration-200
          ${
            isOver
              ? "h-7 w-7 text-destructive"
              : isDragActive
                ? "h-5 w-5 text-muted-foreground"
                : "h-5 w-5 text-muted-foreground/50"
          }
        `}
      />
    </div>
  );
}
