"use client";

import { Button } from "@/components/ui/button";
import {
  PartlyGlyph,
  CloseIcon,
  RefreshIcon,
} from "@/components/icons/WeatherIcons";
import { ICON_TINT } from "@/lib/weather/types";

export interface WeatherPanelBounds {
  top: number;
  height: number;
  right: number;
}

interface WeatherPanelProps {
  open: boolean;
  loading: boolean;
  location: string;
  bounds: WeatherPanelBounds | null;
  onClose: () => void;
  onRefresh: () => void;
  children: React.ReactNode;
}

export function WeatherPanel({
  open,
  loading,
  location,
  bounds,
  onClose,
  onRefresh,
  children,
}: WeatherPanelProps) {
  const placed = bounds ?? { top: 0, height: 0, right: 0 };

  return (
    <>
      {/* Dim overlay — click to dismiss */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-49 transition-opacity duration-300 ease-out"
        style={{
          background: "rgba(34,25,18,0.15)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Floating card */}
      <aside
        className="border-line bg-surface fixed z-50 flex w-93 max-w-[92vw] flex-col overflow-hidden rounded-3xl border"
        style={{
          top: placed.top,
          right: placed.right,
          height: placed.height || "100%",
          boxShadow: "0 18px 48px rgba(34,25,18,0.18)",
          transform: open ? "translateX(0)" : "translateX(calc(100% + 48px))",
          opacity: open ? 1 : 0,
          transition:
            "transform 0.34s cubic-bezier(0.22,0.9,0.32,1), opacity 0.28s ease",
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="border-line flex items-center gap-2.5 border-b px-4 pt-2.75 pb-2.5">
          {/* Cloud pill icon */}
          <span
            className="bg-bg-soft inline-flex size-7 shrink-0 items-center justify-center rounded-full"
            style={{ color: ICON_TINT.partly }}
          >
            <PartlyGlyph size={16} />
          </span>

          {/* Title + location */}
          <div className="min-w-0 flex-1">
            <div className="text-ink-faint text-[9.5px] tracking-widest uppercase">
              Weekly forecast
            </div>
            <div className="text-foreground mt-px text-[15px] font-semibold">
              {location}
            </div>
          </div>

          {/* Close button */}
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
            Powered by OpenWeatherMap + Claude
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
      </aside>
    </>
  );
}
