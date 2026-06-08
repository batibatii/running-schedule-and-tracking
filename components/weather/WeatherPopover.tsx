"use client";

import { Button } from "@/components/ui/button";
import { PartlyGlyph, Sparkle } from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";
import { motion, AnimatePresence } from "framer-motion";
import type { WeatherBounds } from "@/hooks/useWeatherBounds";

interface WeatherPopoverProps {
  open: boolean;
  bounds: WeatherBounds | null;
  onGenerate: () => void;
  onClose: () => void;
}

const popoverVariants = {
  hidden: { opacity: 0, x: 12, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1 },
};

export function WeatherPopover({
  open,
  bounds,
  onGenerate,
  onClose,
}: WeatherPopoverProps) {
  if (!bounds) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Click-away layer */}
          <div className="fixed inset-0 z-20" onClick={onClose} />

          <motion.div
            className="fixed right-15 z-20 w-66 origin-right"
            style={{ top: bounds.statsCenter - 80 }}
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.22, ease: [0.22, 0.9, 0.32, 1] }}
          >
            <div className="border-line bg-surface relative rounded-xl border p-4.5 shadow-lg">
              {/* Caret pointing right toward the badge */}
              <div className="border-line bg-surface absolute top-1/2 -right-1.75 size-3.25 -translate-y-1/2 rotate-45 border-t border-r" />

              {/* Title row */}
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="inline-flex"
                  style={{ color: ICON_TINT.partly }}
                >
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
              <Button
                onClick={onGenerate}
                className="w-full gap-1.75 rounded-full"
              >
                <Sparkle size={14} /> Generate
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
