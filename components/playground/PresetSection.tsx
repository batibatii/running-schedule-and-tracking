"use client";

import { useState } from "react";
import { Preset } from "@/types/playground";
import { PresetChip } from "./PresetChip";
import { ChevronRight } from "lucide-react";

interface PresetSectionProps {
  presets: Preset[];
  onDeletePreset: (id: string) => void;
}

export function PresetSection({ presets, onDeletePreset }: PresetSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (presets.length === 0) return null;

  return (
    <div className="mx-auto max-w-[85%]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 text-xs transition-colors"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
        <span>Presets ({presets.length})</span>
      </button>

      {isOpen && (
        <div className="bg-muted/20 mt-2 flex flex-wrap gap-2 rounded-lg border p-3">
          {presets.map((preset) => (
            <PresetChip
              key={preset.id}
              preset={preset}
              onDelete={onDeletePreset}
            />
          ))}
        </div>
      )}
    </div>
  );
}
