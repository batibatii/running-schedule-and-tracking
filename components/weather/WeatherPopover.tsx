"use client";

import { Button } from "@/components/ui/button";
import { PartlyGlyph, Sparkle } from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";

interface WeatherPopoverProps {
  open: boolean;
  onGenerate: () => void;
  onClose: () => void;
}

export function WeatherPopover({
  open,
  onGenerate,
  onClose,
}: WeatherPopoverProps) {
  return (
    <div
      className="fixed top-[38%] right-15 z-41 w-66 origin-right"
      style={{
        pointerEvents: open ? "auto" : "none",
        opacity: open ? 1 : 0,
        transform: open
          ? "translateX(0) scale(1)"
          : "translateX(12px) scale(0.96)",
        transition:
          "opacity 0.22s ease, transform 0.22s cubic-bezier(0.22,0.9,0.32,1)",
      }}
    >
      {/* Click-away layer */}
      {open && <div className="fixed inset-0 -z-10" onClick={onClose} />}

      <div className="border-line bg-surface relative rounded-xl border p-4.5 shadow-lg">
        {/* Caret pointing right toward the badge */}
        <div className="border-line bg-surface absolute top-1/2 -right-1.75 size-3.25 -translate-y-1/2 rotate-45 border-t border-r" />

        {/* Title row */}
        <div className="mb-1 flex items-center gap-2">
          <span className="inline-flex" style={{ color: ICON_TINT.partly }}>
            <PartlyGlyph size={18} />
          </span>
          <span className="font-display text-foreground text-[22px] italic">
            Weekly forecast
          </span>
        </div>

        {/* Subtitle */}
        <p className="text-ink-soft mb-3.5 text-[12.5px] leading-[1.45]">
          An AI-built 7-day outlook for your training week, tuned to each
          session.
        </p>

        {/* Generate button */}
        <Button onClick={onGenerate} className="w-full gap-1.75 rounded-full">
          <Sparkle size={14} /> Generate
        </Button>
      </div>
    </div>
  );
}
