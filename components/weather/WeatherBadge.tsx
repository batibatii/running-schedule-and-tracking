"use client";

import { Button } from "@/components/ui/button";
import { PartlyGlyph } from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";
import type { WeatherBounds } from "@/hooks/useWeatherBounds";

interface WeatherBadgeProps {
  hidden: boolean;
  bounds: WeatherBounds | null;
  onClick: () => void;
}

export function WeatherBadge({ hidden, bounds, onClick }: WeatherBadgeProps) {
  if (hidden || !bounds) return null;

  return (
    <Button
      variant="outline"
      onClick={onClick}
      aria-label="Weekly forecast"
      className="bg-surface hover:bg-surface fixed right-0 z-10 size-12 rounded-l-2xl rounded-r-none border-r-0"
      style={{
        top: bounds.statsCenter - 24, // center the 48px badge on StatsStrip
        boxShadow: "-6px 4px 18px rgba(34,25,18,0.10)",
        color: ICON_TINT.partly,
      }}
    >
      <PartlyGlyph size={22} />
    </Button>
  );
}
