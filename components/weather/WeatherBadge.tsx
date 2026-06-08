"use client";

import { Button } from "@/components/ui/button";
import { PartlyGlyph } from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";

interface WeatherBadgeProps {
  hidden: boolean;
  onClick: () => void;
}

export function WeatherBadge({ hidden, onClick }: WeatherBadgeProps) {
  if (hidden) return null;

  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label="Weekly forecast"
      className="bg-surface hover:bg-surface fixed top-[42%] right-0 z-40 size-12 rounded-l-2xl rounded-r-none border-r-0 transition-transform duration-200 ease-[cubic-bezier(0.22,0.9,0.32,1)] hover:-translate-x-1"
      style={{
        boxShadow: "-6px 4px 18px rgba(34,25,18,0.10)",
        color: ICON_TINT.partly,
      }}
    >
      <PartlyGlyph size={22} />
    </Button>
  );
}
