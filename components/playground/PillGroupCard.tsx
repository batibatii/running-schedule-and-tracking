"use client";

import { useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { PillGroup, PartialWorkoutFields } from "@/types/playground";
import {
  getSportLabel,
  getWorkoutTypeLabel,
  getZoneLabel,
  getZoneColor,
} from "@/lib/utils/workoutLabels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bookmark } from "lucide-react";

function generatePresetLabel(fields: PartialWorkoutFields): string {
  const parts: string[] = [];
  if (fields.sport) parts.push(getSportLabel(fields.sport));
  if (fields.workoutType) parts.push(getWorkoutTypeLabel(fields.workoutType));
  if (fields.distance) parts.push(`${fields.distance} km`);
  if (fields.pace) parts.push(fields.pace);
  if (fields.heartRateZone) parts.push(getZoneLabel(fields.heartRateZone));
  return parts.join(" · ") || "Preset";
}

interface PillGroupCardProps {
  group: PillGroup;
  isOverlay?: boolean;
  onSaveAsPreset?: (label: string, fields: PartialWorkoutFields) => void;
}

export function PillGroupCard({
  group,
  isOverlay = false,
  onSaveAsPreset,
}: PillGroupCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [presetLabel, setPresetLabel] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: group.id,
    data: { type: "group", group },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: { type: "group-card", groupId: group.id, group },
  });

  const { fields } = group;

  const handleSave = () => {
    const label = presetLabel.trim() || generatePresetLabel(fields);
    onSaveAsPreset?.(label, fields);
    setPresetLabel("");
    setPopoverOpen(false);
  };

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      {...attributes}
      className={`
        rounded-lg border border-pink-200 bg-pink-50/60
        p-2 space-y-1 select-none
        transition-all min-w-30
        ${isDragging && !isOverlay ? "opacity-40" : ""}
        ${isOverlay ? "shadow-lg cursor-grabbing" : "cursor-grab hover:shadow-sm"}
        ${isOver ? "ring-2 ring-pink-400/60" : ""}
      `}
    >
      {/* Header: sport · type + zone badge + save button */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-xs truncate">
          {fields.sport ? getSportLabel(fields.sport) : "—"}
          {fields.workoutType &&
            ` · ${getWorkoutTypeLabel(fields.workoutType)}`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {fields.heartRateZone && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${getZoneColor(fields.heartRateZone)}`}
            >
              {getZoneLabel(fields.heartRateZone)}
            </span>
          )}
          {onSaveAsPreset && !isOverlay && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-4 w-4 text-pink-400 hover:text-pink-600 hover:bg-pink-100"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPresetLabel(generatePresetLabel(fields));
                  }}
                  aria-label="Save as preset"
                >
                  <Bookmark className="size-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-56 p-2"
                align="start"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Save as preset
                  </span>
                  <Input
                    value={presetLabel}
                    onChange={(e) => setPresetLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                    placeholder="Preset name"
                    className="h-7 text-xs"
                    autoFocus
                  />
                  <Button size="xs" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {(fields.distance || fields.pace) && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {fields.distance && <span>{fields.distance} km</span>}
          {fields.pace && <span>{fields.pace} /km</span>}
        </div>
      )}

      <div className="text-[10px] text-pink-400">
        {group.pills.length} pill{group.pills.length !== 1 && "s"}
      </div>
    </div>
  );
}
