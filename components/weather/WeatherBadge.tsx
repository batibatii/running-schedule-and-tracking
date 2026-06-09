"use client";

import { Button } from "@/components/ui/button";
import { WEATHER_GLYPH, PartlyGlyph } from "@/components/icons/WeatherIcons";
import { WEATHER_ICON_TINT } from "@/lib/constants/ui";
import { motion, AnimatePresence } from "framer-motion";
import type { WeatherIcon } from "@/lib/weather/types";
import type { WeatherBounds } from "@/hooks/useWeatherBounds";

interface WeatherBadgeProps {
  hidden: boolean;
  bounds: WeatherBounds | null;
  weatherIcon?: WeatherIcon | null;
  onClick: () => void;
}

export function WeatherBadge({
  hidden,
  bounds,
  weatherIcon,
  onClick,
}: WeatherBadgeProps) {
  if (!bounds) return null;

  const icon = weatherIcon ?? "partly";
  const Glyph = WEATHER_GLYPH[icon] ?? PartlyGlyph;
  const tint = WEATHER_ICON_TINT[icon];

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 z-10"
          style={{ top: bounds.statsCenter - 24 }}
        >
          <Button
            variant="outline"
            onClick={onClick}
            aria-label="Weekly forecast"
            className="bg-surface hover:bg-surface group relative size-12 overflow-hidden rounded-l-2xl rounded-r-none border-r-0"
            style={{
              boxShadow: "-6px 4px 18px rgba(34,25,18,0.10)",
              color: tint,
            }}
          >
            {/* Shine sweep — moves from top-left to bottom-right on hover */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full -translate-y-full transition-transform duration-700 ease-out group-hover:translate-x-full group-hover:translate-y-full"
              style={{
                background: `linear-gradient(135deg, transparent 30%, ${tint}50 50%, transparent 70%)`,
              }}
            />
            <span className="relative">
              <Glyph size={26} />
            </span>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
