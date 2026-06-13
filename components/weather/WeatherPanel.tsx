"use client";

import { Button } from "@/components/ui/button";
import {
  PartlyGlyph,
  CloseIcon,
  RefreshIcon,
} from "@/components/icons/WeatherIcons";
import { WEATHER_ICON_TINT } from "@/lib/constants/ui";
import { motion, AnimatePresence } from "framer-motion";
import type { WeatherBounds } from "@/hooks/useWeatherBounds";

interface WeatherPanelProps {
  open: boolean;
  loading: boolean;
  location: string;
  bounds: WeatherBounds | null;
  onClose: () => void;
  onRefresh: () => void;
  children: React.ReactNode;
}

/** Gap between schedule content right edge and panel left edge. */
const CONTENT_GAP = 16;

const panelVariants = {
  hidden: { x: "calc(100% + 48px)", opacity: 0 },
  visible: { x: 0, opacity: 1 },
};

export function WeatherPanel({
  open,
  loading,
  location,
  bounds,
  onClose,
  onRefresh,
  children,
}: WeatherPanelProps) {
  if (!bounds) return null;

  const panelLeft = bounds.contentRight + CONTENT_GAP;
  const panelWidth = bounds.viewportWidth - panelLeft - CONTENT_GAP;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="border-line bg-surface fixed z-10 flex flex-col overflow-hidden rounded-3xl border"
          style={{
            top: bounds.statsTop,
            bottom: bounds.viewportHeight - bounds.gridBottom,
            left: panelLeft,
            width: Math.min(panelWidth, 372),
            boxShadow: "0 18px 48px rgba(34,25,18,0.18)",
          }}
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{
            duration: 0.34,
            ease: [0.22, 0.9, 0.32, 1],
          }}
        >
          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="border-line flex items-center gap-2.5 border-b px-4 pt-2.75 pb-2.5">
            <span
              className="bg-bg-soft inline-flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{ color: WEATHER_ICON_TINT.partly }}
            >
              <PartlyGlyph size={16} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="text-ink-faint text-[9.5px] tracking-widest uppercase">
                Weekly forecast
              </div>
              <div className="text-foreground mt-px text-[15px] font-semibold">
                {location}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full"
            >
              <CloseIcon size={15} />
            </Button>
          </div>

          {/* ── Body (scrollable) ───────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-4 py-3.25">{children}</div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div className="border-line flex items-center justify-between border-t px-4 py-2">
            <span className="text-ink-faint text-[11px]">
              Powered by Open-Meteo
            </span>
            <Button
              variant="ghost"
              size="xs"
              onClick={onRefresh}
              disabled={loading}
              className="text-coral-deep disabled:text-ink-faint gap-1.5"
            >
              <RefreshIcon size={13} /> Refresh
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
