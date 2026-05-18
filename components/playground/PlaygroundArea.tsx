"use client";

import { useState, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  Pill,
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

interface PlaygroundAreaProps {
  items: PlaygroundItem[];
  onAddPill: (
    fieldType: PillFieldType,
    value: string | number,
    label: string,
  ) => void;
  isDragActive: boolean;
  activeId: string | null;
  activeDragType: DragItemType | null;
  onSaveAsPreset?: (label: string, fields: PartialWorkoutFields) => void;
  presets?: Preset[];
  onDeletePreset?: (id: string) => void;
}

export function PlaygroundArea({
  items,
  onAddPill,
  isDragActive,
  activeId,
  activeDragType,
  onSaveAsPreset,
  presets,
  onDeletePreset,
}: PlaygroundAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "playground-drop",
    data: { type: "playground" },
  });

  const activePillFieldType =
    activeDragType === "pill"
      ? items.find(
          (item): item is Pill => item.kind === "pill" && item.id === activeId,
        )?.fieldType
      : undefined;

  return (
    <section
      ref={setNodeRef}
      className={`border-line bg-surface rounded-[24px] border p-5.5 transition-all ${isOver ? "ring-coral-deep/40 ring-2" : ""}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="text-ink-faint mb-0.5 text-[11px] tracking-widest uppercase">
            Workout builder
          </div>
          <h2 className="font-display m-0 text-2xl font-normal">Playground</h2>
        </div>
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
        />
        <GeneratorSection
          title="Effort"
          fieldType="pace"
          onAddPill={onAddPill}
          inputType="pace"
          inputPlaceholder="5:30"
          align="right"
        />
      </div>

      {/* Center drop zone */}
      <div className="border-line-strong my-3.5 flex min-h-20 flex-wrap items-center gap-2 rounded-[18px] border border-dashed p-4">
        {items.length === 0 && !isDragActive && (
          <span className="text-ink-faint mx-auto text-xs">
            Create items using the + buttons, then drag them to your schedule
          </span>
        )}
        {items.map((item) =>
          item.kind === "pill" ? (
            <PillChip
              key={item.id}
              pill={item}
              isMergeTarget={
                activeDragType === "pill" &&
                activeId !== item.id &&
                activePillFieldType !== item.fieldType
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
      </div>

      {/* Bottom generators: Workout Type + Distance */}
      <div className="grid grid-cols-2 gap-4">
        <GeneratorSection
          title="Workout Type"
          fieldType="workoutType"
          onAddPill={onAddPill}
          options={WORKOUT_TYPE_OPTIONS}
          align="left"
        />
        <GeneratorSection
          title="Distance"
          fieldType="distance"
          onAddPill={onAddPill}
          inputType="number"
          inputPlaceholder="10"
          inputSuffix="KM"
          align="right"
        />
      </div>

      {/* Presets footer */}
      {presets && onDeletePreset && (
        <PresetSection presets={presets} onDeletePreset={onDeletePreset} />
      )}
    </section>
  );
}
