"use client";

import { Preset } from "@/types/playground";
import { PresetChip } from "./PresetChip";

interface PresetSectionProps {
  presets: Preset[];
}

export function PresetSection({ presets }: PresetSectionProps) {
  if (presets.length === 0) return null;

  return (
    <div className="border-line mt-4.5 flex flex-wrap items-center gap-2.5 border-t pt-4">
      <span className="text-ink-faint text-[11px] tracking-[0.08em] uppercase">
        Presets ({presets.length})
      </span>
      {presets.map((preset) => (
        <PresetChip key={preset.id} preset={preset} />
      ))}
    </div>
  );
}
