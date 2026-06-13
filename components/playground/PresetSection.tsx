"use client";

import { Preset } from "@/types/playground";
import { PresetChip } from "./PresetChip";
import {
  PRESET_CAPACITY,
  CAPACITY_WARNING_THRESHOLD,
  CAPACITY_CRITICAL_THRESHOLD,
  CAPACITY_COLOR_AMBER_WARNING,
  CAPACITY_COLOR_CORAL_CRITICAL,
} from "@/lib/constants/playground";

interface PresetSectionProps {
  presets: Preset[];
}

export function PresetSection({ presets }: PresetSectionProps) {
  if (presets.length === 0) return null;

  const fraction = presets.length / PRESET_CAPACITY;
  const atCapacity = presets.length >= PRESET_CAPACITY;

  return (
    <div className="border-line-strong mt-4.5 flex flex-wrap items-center gap-2.5 border-t pt-4">
      <span className="text-ink-faint text-[11px] tracking-[0.08em] uppercase">
        Presets
      </span>
      {presets.map((preset) => (
        <PresetChip key={preset.id} preset={preset} />
      ))}
      <span
        className="text-ink-faint ml-auto self-end font-mono text-[11px]"
        style={{
          color: atCapacity
            ? CAPACITY_COLOR_CORAL_CRITICAL
            : fraction >= CAPACITY_WARNING_THRESHOLD
              ? CAPACITY_COLOR_AMBER_WARNING
              : undefined,
        }}
      >
        {presets.length} / {PRESET_CAPACITY}
      </span>
    </div>
  );
}
