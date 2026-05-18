"use client";

import { useDraggable } from "@dnd-kit/core";
import { Preset } from "@/types/playground";
import { SportIcon } from "@/components/icons/SportIcon";
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

  const workoutType = preset.fields.workoutType ?? "easy";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`border-line bg-bg-soft inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.25 text-xs font-medium transition-all select-none ${isDragging && !isOverlay ? "opacity-40" : ""} ${isOverlay ? "cursor-grabbing shadow-lg" : "cursor-grab hover:shadow-sm"}`}
    >
      <span
        className="inline-flex h-4.5 w-4.5 items-center justify-center rounded-full"
        style={{
          backgroundColor: `var(--workout-${workoutType})`,
        }}
      >
        <SportIcon sport={preset.fields.sport ?? "running"} size={10} />
      </span>
      <span>{preset.label}</span>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id);
          }}
          className="text-ink-faint hover:bg-bg-soft hover:text-foreground ml-0.5 h-4 w-4"
          aria-label="Delete preset"
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
