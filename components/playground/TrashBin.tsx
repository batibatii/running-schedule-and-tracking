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
        fixed bottom-8 left-1/2 -translate-x-1/2 z-50
        flex items-center justify-center
        rounded-xl border-2 border-dashed
        transition-all duration-300 ease-out
        ${
          isDragActive
            ? isOver
              ? "opacity-100 scale-110 border-destructive bg-destructive/15 shadow-lg"
              : "opacity-100 scale-100 border-muted-foreground/40 bg-background/90 shadow-md backdrop-blur-sm"
            : "opacity-0 scale-75 pointer-events-none"
        }
        w-16 h-16
      `}
    >
      <Trash2
        className={`
          transition-all duration-200
          ${
            isOver
              ? "h-7 w-7 text-destructive"
              : "h-5 w-5 text-muted-foreground"
          }
        `}
      />
    </div>
  );
}
