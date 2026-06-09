"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchWeatherAction } from "@/app/actions/weather";
import type { WeatherForecast } from "@/lib/weather/types";

/** Client-side cache: reuse forecast for 30 minutes. */
const CACHE_TTL_MS = 30 * 60 * 1000;

let cachedForecast: WeatherForecast | null = null;
let cachedAt = 0;

function getCachedForecast(): WeatherForecast | null {
  if (cachedForecast && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedForecast;
  }
  return null;
}

function setCachedForecast(forecast: WeatherForecast) {
  cachedForecast = forecast;
  cachedAt = Date.now();
}

export function useWeather() {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);

  const { requestLocation, usedFallback } = useGeolocation();

  const fetchForecast = async (skipCache = false) => {
    if (!skipCache) {
      const cached = getCachedForecast();
      if (cached) {
        setForecast(cached);
        return;
      }
    }

    setLoading(true);

    try {
      const coords = await requestLocation();
      const result = await fetchWeatherAction(
        coords.latitude,
        coords.longitude,
      );

      if (!result.success || !result.data) {
        throw new Error(result.message);
      }

      setCachedForecast(result.data);
      setForecast(result.data);

      if (usedFallback) {
        toast(
          "Using default location (Istanbul). Allow location access for local weather.",
          {
            duration: 5000,
          },
        );
      }
    } catch (error) {
      console.error("[weather]", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setPopoverOpen(false);
    setPanelOpen(true);
    setForecast(null); // Show skeleton for first load

    try {
      await fetchForecast();
    } catch {
      setPanelOpen(false);
      toast.error("Couldn't load the forecast. Try again in a moment.");
    }
  };

  const handleRefresh = async () => {
    // Keep stale forecast visible during refresh — only replace on success
    try {
      await fetchForecast(true);
    } catch {
      toast.error("Couldn't refresh the forecast. Try again in a moment.");
    }
  };

  const handleBadgeClick = () => setPopoverOpen((prev) => !prev);
  const handlePopoverClose = () => setPopoverOpen(false);
  const handlePanelClose = () => setPanelOpen(false);

  return {
    popoverOpen,
    panelOpen,
    loading,
    forecast,
    handleGenerate,
    handleRefresh,
    handleBadgeClick,
    handlePopoverClose,
    handlePanelClose,
  };
}
