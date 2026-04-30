"use client";

import { useDraggable } from "@dnd-kit/core";
import { Preset } from "@/types/playground";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface PresetChipProps {
  preset: Preset;
  isOverlay?: boolean;
  onDelete?: (id: string) => void;
}

export function PresetChip({
  preset,
  isOverlay = false,
  onDelete,
}: PresetChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `preset-${preset.id}`,
    data: { type: "preset", preset },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
        border border-indigo-200 bg-indigo-50 text-indigo-800
        text-xs font-medium select-none transition-all
        ${isDragging && !isOverlay ? "opacity-40" : ""}
        ${isOverlay ? "shadow-lg cursor-grabbing" : "cursor-grab hover:shadow-sm"}
      `}
    >
      <span>{preset.label}</span>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id);
          }}
          className="text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 ml-0.5 h-4 w-4"
          aria-label="Delete preset"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
