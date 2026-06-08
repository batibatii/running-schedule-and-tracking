"use client";

import { useRef, useState, useEffect } from "react";
import type { WeatherPanelBounds } from "@/components/weather/WeatherPanel";

const PANEL_GAP = 16; // px gap between grid right edge and panel left edge

export function useWeatherBounds(panelOpen: boolean) {
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<WeatherPanelBounds | null>(null);

  useEffect(() => {
    if (!panelOpen) {
      setBounds(null);
      return;
    }

    function measure() {
      const statsElement = statsRef.current;
      const gridElement = gridRef.current;
      if (!statsElement || !gridElement) return;

      const statsRect = statsElement.getBoundingClientRect();
      const gridRect = gridElement.getBoundingClientRect();

      setBounds({
        top: statsRect.top,
        height: gridRect.bottom - statsRect.top,
        right: window.innerWidth - gridRect.right + PANEL_GAP,
      });
    }

    // Initial measurement
    measure();

    // Re-measure on resize and scroll
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    // Re-measure on content reflow (e.g., workouts added/removed)
    const resizeObserver = new ResizeObserver(measure);
    if (gridRef.current) resizeObserver.observe(gridRef.current);

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
    };
  }, [panelOpen]);

  return { statsRef, gridRef, bounds };
}
