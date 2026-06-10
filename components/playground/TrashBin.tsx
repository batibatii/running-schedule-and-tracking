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
      className={`fixed bottom-2 left-1/2 z-50 flex -translate-x-1/2 items-center justify-center rounded-[18px] border-2 border-dashed transition-all duration-300 ease-out ${
        isDragActive
          ? isOver
            ? "border-coral-deep bg-coral/15 scale-110 opacity-100 shadow-lg"
            : "border-ink-faint/40 bg-surface/90 scale-100 opacity-100 shadow-md backdrop-blur-sm"
          : "pointer-events-none scale-75 opacity-0"
      } h-16 w-16`}
    >
      <Trash2
        className={`transition-all duration-200 ${
          isOver ? "text-coral-deep h-7 w-7" : "text-ink-faint h-5 w-5"
        }`}
      />
    </div>
  );
}
