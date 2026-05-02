"use client";

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
import { GeneratorSection } from "./GeneratorSection";
import { PillChip } from "./PillChip";
import { PillGroupCard } from "./PillGroupCard";

const SPORT_OPTIONS = SPORTS.map((sport) => ({
  value: sport,
  label: getSportDisplayName(sport),
}));

const WORKOUT_TYPE_OPTIONS = WORKOUT_TYPES.map((type) => ({
  value: type,
  label: WORKOUT_TYPE_LABELS[type],
}));

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
}

export function PlaygroundArea({
  items,
  onAddPill,
  isDragActive,
  activeId,
  activeDragType,
  onSaveAsPreset,
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
    <div
      ref={setNodeRef}
      className={`bg-muted/30 rounded-lg border p-4 transition-all ${isOver ? "ring-primary/40 ring-2" : ""} `}
    >
      <div className="grid min-h-40 grid-rows-[auto_1fr_auto] gap-4">
        <div className="flex items-start justify-between">
          <GeneratorSection
            title="Sport"
            fieldType="sport"
            onAddPill={onAddPill}
            options={SPORT_OPTIONS}
          />
          <GeneratorSection
            title="Effort"
            fieldType="pace"
            onAddPill={onAddPill}
            inputType="pace"
            inputPlaceholder="5:30"
          />
        </div>

        <div className="flex min-h-16 flex-wrap content-start items-start gap-2 rounded-md p-2">
          {items.length === 0 && !isDragActive && (
            <span className="text-muted-foreground mx-auto self-center text-xs">
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

        <div className="flex items-end justify-between">
          <GeneratorSection
            title="Workout Type"
            fieldType="workoutType"
            onAddPill={onAddPill}
            options={WORKOUT_TYPE_OPTIONS}
          />
          <GeneratorSection
            title="Distance"
            fieldType="distance"
            onAddPill={onAddPill}
            inputType="number"
            inputPlaceholder="10"
            inputSuffix="KM"
          />
        </div>
      </div>
    </div>
  );
}
