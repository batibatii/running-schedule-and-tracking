import type { WeatherForecast } from "./types";
import type { OpenMeteoResponse } from "./mappers";
import { mapOpenMeteoToForecast } from "./mappers";

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/reverse";

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
): Promise<WeatherForecast> {
  const url = new URL(OPEN_METEO_BASE_URL);
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
  );
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Open-Meteo API error: ${response.status} ${response.statusText}`,
    );
  }

  const data: OpenMeteoResponse = await response.json();
  const location = await reverseGeocode(latitude, longitude);

  return mapOpenMeteoToForecast(data, location);
}

/**
 * Reverse geocode using OpenStreetMap Nominatim (free, no key).
 * Falls back to raw coordinates on failure.
 */
async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "10"); // city-level detail

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "GrindTrack/1.0" }, // Nominatim requires User-Agent
    });

    if (!response.ok) {
      return `${latitude.toFixed(1)}, ${longitude.toFixed(1)}`;
    }

    const data = await response.json();
    const city =
      data.address?.city ??
      data.address?.town ??
      data.address?.village ??
      data.address?.county;
    const country = data.address?.country_code?.toUpperCase();

    if (city && country) return `${city}, ${country}`;
  } catch {
    // Silently fall back — location name is cosmetic
  }

  return `${latitude.toFixed(1)}, ${longitude.toFixed(1)}`;
}
