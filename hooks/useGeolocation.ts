"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "grindtrack:user-location";

/** Cache expires after 7 days — re-request if the user may have traveled. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Default fallback: Istanbul, TR */
const DEFAULT_LOCATION = { latitude: 41.0082, longitude: 28.9784 };

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
}

function loadCached(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cached: CachedLocation = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function saveCache(latitude: number, longitude: number) {
  const entry: CachedLocation = { latitude, longitude, timestamp: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback((): Promise<{
    latitude: number;
    longitude: number;
  }> => {
    // Return cached if available
    const cached = loadCached();
    if (cached) {
      setState({
        latitude: cached.latitude,
        longitude: cached.longitude,
        loading: false,
        error: null,
      });
      return Promise.resolve({
        latitude: cached.latitude,
        longitude: cached.longitude,
      });
    }

    // No cache — request from browser
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        ...DEFAULT_LOCATION,
        loading: false,
        error: "Geolocation not supported",
      });
      return Promise.resolve(DEFAULT_LOCATION);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          saveCache(coords.latitude, coords.longitude);
          setState({ ...coords, loading: false, error: null });
          resolve(coords);
        },
        (geolocationError) => {
          setState({
            ...DEFAULT_LOCATION,
            loading: false,
            error: geolocationError.message,
          });
          resolve(DEFAULT_LOCATION);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
      );
    });
  }, []);

  return { ...state, requestLocation };
}
