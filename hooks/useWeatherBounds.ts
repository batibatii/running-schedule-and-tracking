"use client";

// ---------------------------------------------------------------------------
// useWeatherBounds — measures StatsStrip and grid positions so the weather
// badge, popover, and panel can be fixed-positioned in the right gutter
// (between the schedule's right edge and the viewport's right edge).
// ---------------------------------------------------------------------------

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type RefObject,
} from "react";

export interface WeatherBounds {
  /** Top of StatsStrip (viewport-relative). */
  statsTop: number;
  /** Vertical center of StatsStrip. */
  statsCenter: number;
  /** Bottom of the 7-day grid. */
  gridBottom: number;
  /** Right edge of the schedule content (viewport-relative). */
  contentRight: number;
  viewportWidth: number;
  viewportHeight: number;
}

export function useWeatherBounds() {
  const statsRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<WeatherBounds | null>(null);
  const rafId = useRef(0);

  const measure = useCallback(() => {
    const statsElement = statsRef.current;
    const gridElement = gridRef.current;
    if (!statsElement || !gridElement) return;

    // Cancel any pending frame to prevent redundant reads
    cancelAnimationFrame(rafId.current);

    // Read geometry after the browser finishes its layout pass
    rafId.current = requestAnimationFrame(() => {
      const statsRect = statsElement.getBoundingClientRect();
      const gridRect = gridElement.getBoundingClientRect();

      setBounds({
        statsTop: statsRect.top,
        statsCenter: statsRect.top + statsRect.height / 2,
        gridBottom: gridRect.bottom,
        contentRight: gridRect.right,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      });
    });
  }, []);

  useEffect(() => {
    measure();

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });

    // Catch element size changes (e.g., workout cards expanding a day column)
    const resizeObserver = new ResizeObserver(measure);
    if (statsRef.current) resizeObserver.observe(statsRef.current);
    if (gridRef.current) resizeObserver.observe(gridRef.current);

    // Catch DOM changes (children added/removed) that may not immediately
    // trigger a resize — e.g., deleting the last workout shrinks the grid
    const mutationObserver = new MutationObserver(measure);
    if (gridRef.current) {
      mutationObserver.observe(gridRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure]);

  return { statsRef, gridRef, bounds };
}
