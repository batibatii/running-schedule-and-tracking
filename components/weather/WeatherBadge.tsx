"use client";

import { Button } from "@/components/ui/button";
import { PartlyGlyph } from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";
import { motion, AnimatePresence } from "framer-motion";
import type { WeatherBounds } from "@/hooks/useWeatherBounds";

interface WeatherBadgeProps {
  hidden: boolean;
  bounds: WeatherBounds | null;
  onClick: () => void;
}

export function WeatherBadge({ hidden, bounds, onClick }: WeatherBadgeProps) {
  if (!bounds) return null;

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
            className="bg-surface hover:bg-surface size-12 rounded-l-2xl rounded-r-none border-r-0"
            style={{
              boxShadow: "-6px 4px 18px rgba(34,25,18,0.10)",
              color: ICON_TINT.partly,
            }}
          >
            <PartlyGlyph size={22} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
