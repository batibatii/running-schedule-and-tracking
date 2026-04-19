"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  PlaygroundItem,
  PillFieldType,
  DragItemType,
} from "@/types/playground";
import { SPORTS } from "@/types/workout";
import { GeneratorSection } from "./GeneratorSection";
import { PillChip } from "./PillChip";
import { PillGroupCard } from "./PillGroupCard";
import { TrashBin } from "./TrashBin";

const SPORT_OPTIONS = SPORTS.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const WORKOUT_TYPE_OPTIONS = [
  { value: "easy", label: "Easy Run" },
  { value: "tempo", label: "Tempo" },
  { value: "interval", label: "Interval" },
  { value: "long", label: "Long Run" },
  { value: "recovery", label: "Recovery" },
  { value: "race", label: "Race" },
];

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
}

export function PlaygroundArea({
  items,
  onAddPill,
  isDragActive,
  activeId,
  activeDragType,
}: PlaygroundAreaProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "playground-drop",
    data: { type: "playground" },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        border rounded-lg p-4 bg-muted/30 transition-all
        ${isOver ? "ring-2 ring-primary/40" : ""}
      `}
    >
      <div className="grid grid-rows-[auto_1fr_auto] gap-4 min-h-40">
        <div className="flex justify-between items-start">
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

        <div className="flex flex-wrap gap-2 content-start min-h-16 p-2 rounded-md">
          {items.length === 0 && !isDragActive && (
            <span className="text-xs text-muted-foreground self-center mx-auto">
              Create items using the + buttons, then drag them to your schedule
            </span>
          )}
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
              <PillGroupCard key={item.id} group={item} />
            ),
          )}
        </div>

        <div className="flex justify-between items-end">
          <GeneratorSection
            title="Workout Type"
            fieldType="workoutType"
            onAddPill={onAddPill}
            options={WORKOUT_TYPE_OPTIONS}
          />
          <div className="flex items-end gap-4">
            <GeneratorSection
              title="Distance"
              fieldType="distance"
              onAddPill={onAddPill}
              inputType="number"
              inputPlaceholder="10"
              inputSuffix="KM"
            />
            <TrashBin isDragActive={isDragActive} />
          </div>
        </div>
      </div>
    </div>
  );
}
