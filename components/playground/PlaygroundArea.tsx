"use client";

import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  PlaygroundItem,
  PillFieldType,
  PartialWorkoutFields,
  DragItemType,
} from "@/types/playground";
import { SPORTS, WORKOUT_TYPES } from "@/types/workout";
import {
  getSportDisplayName,
  WORKOUT_TYPE_LABELS,
} from "@/lib/utils/workoutLabels";
import {
  PLAYGROUND_CAPACITY,
  CAPACITY_WARNING_THRESHOLD,
  CAPACITY_CRITICAL_THRESHOLD,
  CAPACITY_COLOR_AMBER_WARNING,
  CAPACITY_COLOR_CORAL_CRITICAL,
} from "@/lib/constants/playground";
import { Preset } from "@/types/playground";
import { GeneratorSection } from "./GeneratorSection";
import { PillChip } from "./PillChip";
import { PillGroupCard } from "./PillGroupCard";
import { PresetSection } from "./PresetSection";

const SPORT_OPTIONS = SPORTS.map((sport) => ({
  value: sport,
  label: getSportDisplayName(sport),
}));

const WORKOUT_TYPE_OPTIONS = WORKOUT_TYPES.map((type) => ({
  value: type,
  label: WORKOUT_TYPE_LABELS[type],
}));

const PLAYGROUND_TIPS = [
  "Drag pills to merge them, then drop the card on a day.",
  "Hold \u2325 to duplicate a pill while dragging.",
  "Save any merged card as a preset to reuse it next week.",
];

function RotatingTip() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setCurrentIndex((prev) => (prev + 1) % PLAYGROUND_TIPS.length),
      3800,
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="relative h-4.5 w-95 overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
      }}
    >
      {PLAYGROUND_TIPS.map((tip, tipIndex) => {
        const isActive = tipIndex === currentIndex;
        const isPrevious =
          tipIndex ===
          (currentIndex - 1 + PLAYGROUND_TIPS.length) % PLAYGROUND_TIPS.length;
        return (
          <span
            key={tipIndex}
            className="text-ink-soft absolute inset-0 flex items-center justify-end text-xs whitespace-nowrap transition-all duration-500"
            style={{
              transform: isActive
                ? "translateX(0)"
                : isPrevious
                  ? "translateX(-24px)"
                  : "translateX(40px)",
              opacity: isActive ? 1 : 0,
              transitionTimingFunction: "cubic-bezier(0.22, 0.9, 0.32, 1)",
            }}
          >
            {tip}
          </span>
        );
      })}
    </div>
  );
}

function getDropZoneBorderColor(capacityFraction: number): string {
  if (capacityFraction >= CAPACITY_CRITICAL_THRESHOLD)
    return CAPACITY_COLOR_CORAL_CRITICAL;
  if (capacityFraction >= CAPACITY_WARNING_THRESHOLD)
    return CAPACITY_COLOR_AMBER_WARNING;
  return ""; // default — let Tailwind border-line-strong handle it
}

interface PlaygroundAreaProps {
  items: PlaygroundItem[];
  onAddPill: (
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) => boolean;
  isDragActive: boolean;
  activeId: string | null;
  activeDragType: DragItemType | null;
  remainingSlots: number;
  onSaveAsPreset?: (label: string, fields: PartialWorkoutFields) => void;
  presets?: Preset[];
}

export function PlaygroundArea({
  items,
  onAddPill,
  isDragActive,
  activeId,
  activeDragType,
  remainingSlots,
  onSaveAsPreset,
  presets,
}: PlaygroundAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "playground-drop",
    data: { type: "playground" },
  });

  const capacityFraction = items.length / PLAYGROUND_CAPACITY;
  const atCapacity = remainingSlots <= 0;
  const dropZoneBorderColor = getDropZoneBorderColor(capacityFraction);

  return (
    <div
      ref={setNodeRef}
      className={`flex max-h-107.5 flex-col gap-3.5 overflow-hidden transition-all ${isOver ? "ring-coral-deep/40 rounded-xl ring-2" : ""}`}
    >
      <div className="flex justify-end pt-4">
        <RotatingTip />
      </div>

      {/* Top generators: Sport + Effort */}
      <div className="grid grid-cols-2 gap-4">
        <GeneratorSection
          title="Sport"
          fieldType="sport"
          onAddPill={onAddPill}
          options={SPORT_OPTIONS}
          align="left"
          atCapacity={atCapacity}
        />
        <GeneratorSection
          title="Effort"
          fieldType="pace"
          onAddPill={onAddPill}
          inputType="pace"
          inputPlaceholder="5:30"
          align="right"
          atCapacity={atCapacity}
        />
      </div>

      {/* Center drop zone */}
      <div
        className="border-line-strong flex max-h-40 min-h-20 flex-wrap items-start gap-2 overflow-y-auto rounded-[18px] border border-dashed p-4 transition-colors duration-300"
        style={
          dropZoneBorderColor ? { borderColor: dropZoneBorderColor } : undefined
        }
      >
        {items.length === 0 && !isDragActive ? (
          <span className="text-ink-faint mx-auto self-center text-xs">
            Create items using the + buttons, then drag them to your schedule
          </span>
        ) : (
          <>
            {items.map((item) =>
              item.kind === "pill" ? (
                <PillChip
                  key={item.id}
                  pill={item}
                  isMergeTarget={
                    activeDragType === "pill" && activeId !== item.id
                  }
                />
              ) : (
                <PillGroupCard
                  key={item.id}
                  group={item}
                  onSaveAsPreset={onSaveAsPreset}
                />
              ),
            )}
            {/* Capacity counter */}
            <span
              className="text-ink-faint ml-auto self-end font-mono text-[11px]"
              style={{
                color: atCapacity
                  ? CAPACITY_COLOR_CORAL_CRITICAL
                  : capacityFraction >= CAPACITY_WARNING_THRESHOLD
                    ? CAPACITY_COLOR_AMBER_WARNING
                    : undefined,
              }}
            >
              {items.length} / {PLAYGROUND_CAPACITY}
            </span>
          </>
        )}
      </div>

      {/* Bottom generators: Workout Type + Distance */}
      <div className="grid grid-cols-2 gap-4">
        <GeneratorSection
          title="Workout Type"
          fieldType="workoutType"
          onAddPill={onAddPill}
          options={WORKOUT_TYPE_OPTIONS}
          align="left"
          atCapacity={atCapacity}
        />
        <GeneratorSection
          title="Distance"
          fieldType="distance"
          onAddPill={onAddPill}
          inputType="number"
          inputPlaceholder="10"
          inputSuffix="KM"
          align="right"
          atCapacity={atCapacity}
        />
      </div>

      {/* Presets footer */}
      {presets && presets.length > 0 && <PresetSection presets={presets} />}
    </div>
  );
}
