import type { WeatherForecast } from "./types";
import { normalizeOWMResponse, mapOpenWeatherToForecast } from "./mappers";

const OPENWEATHER_BASE_URL = "https://api.openweathermap.org";

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
): Promise<WeatherForecast> {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error("OPENWEATHERMAP_API_KEY is not configured");
  }

  const forecastUrl = new URL("/data/3.0/onecall", OPENWEATHER_BASE_URL);
  forecastUrl.searchParams.set("lat", String(latitude));
  forecastUrl.searchParams.set("lon", String(longitude));
  forecastUrl.searchParams.set("appid", apiKey);
  forecastUrl.searchParams.set("units", "metric");
  forecastUrl.searchParams.set("exclude", "minutely,hourly,alerts");

  const forecastResponse = await fetch(forecastUrl.toString());
  if (!forecastResponse.ok) {
    throw new Error(
      `OpenWeatherMap API error: ${forecastResponse.status} ${forecastResponse.statusText}`,
    );
  }

  const rawForecast = await forecastResponse.json();
  const normalizedForecast = normalizeOWMResponse(rawForecast);

  const locationName = await reverseGeocode(latitude, longitude, apiKey);

  const dateRange = buildDateRange(normalizedForecast.daily);

  return mapOpenWeatherToForecast(normalizedForecast, locationName, dateRange);
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<string> {
  try {
    const geocodeUrl = new URL("/geo/1.0/reverse", OPENWEATHER_BASE_URL);
    geocodeUrl.searchParams.set("lat", String(latitude));
    geocodeUrl.searchParams.set("lon", String(longitude));
    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("appid", apiKey);

    const geocodeResponse = await fetch(geocodeUrl.toString());
    if (!geocodeResponse.ok) {
      return `${latitude.toFixed(1)}, ${longitude.toFixed(1)}`;
    }

    const geocodeData = await geocodeResponse.json();
    if (geocodeData.length > 0) {
      const { name, country } = geocodeData[0];
      return `${name}, ${country}`;
    }
  } catch {
    // Silently fall back — location name is cosmetic
  }

  return `${latitude.toFixed(1)}, ${longitude.toFixed(1)}`;
}

function buildDateRange(daily: Array<{ unixTimestamp: number }>): string {
  if (daily.length === 0) return "";

  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const yearFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric" });

  const firstDate = new Date(daily[0].unixTimestamp * 1000);
  const lastDate = new Date(daily[daily.length - 1].unixTimestamp * 1000);

  const start = formatter.format(firstDate);
  const end = formatter.format(lastDate);
  const year = yearFormatter.format(lastDate);

  return `${start} – ${end}, ${year}`;
}
