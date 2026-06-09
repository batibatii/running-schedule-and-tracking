import type {
  WeatherForecast,
  WeatherIcon,
  CurrentConditions,
  DailyForecast,
} from "./types";

// ---------------------------------------------------------------------------
// Open-Meteo API response types (subset we use)
// ---------------------------------------------------------------------------

export interface OpenMeteoCurrent {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
}

export interface OpenMeteoDaily {
  time: string[]; // ["2026-06-08", "2026-06-09", ...]
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  wind_speed_10m_max: number[];
}

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/**
 *
 * WMO codes: https://open-meteo.com/en/docs#weathervariables
 *   0       = Clear sky
 *   1–3     = Partly cloudy
 *   45–48   = Fog
 *   51–57   = Drizzle
 *   61–67   = Rain
 *   71–77   = Snow
 *   80–82   = Rain showers
 *   95–99   = Thunderstorm
 */
function mapWmoCodeToIcon(code: number): WeatherIcon {
  if (code === 0) return "sun";
  if (code <= 3) return "partly";
  if (code <= 48) return "cloud"; // fog
  if (code <= 67) return "rain"; // drizzle + rain
  if (code <= 77) return "cloud"; // snow
  if (code <= 82) return "rain"; // rain showers
  return "rain"; // thunderstorm
}

function wmoConditionLabel(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 55) return "Drizzle";
  if (code <= 57) return "Freezing drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Freezing rain";
  if (code <= 75) return "Snowfall";
  if (code <= 77) return "Snow grains";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code === 95) return "Thunderstorm";
  return "Thunderstorm with hail";
}

export function mapOpenMeteoToForecast(
  response: OpenMeteoResponse,
  location: string,
): WeatherForecast {
  const current: CurrentConditions = {
    icon: mapWmoCodeToIcon(response.current.weather_code),
    temp: Math.round(response.current.temperature_2m),
    feelsLike: Math.round(response.current.apparent_temperature),
    caption: wmoConditionLabel(response.current.weather_code),
  };

  const daily: DailyForecast[] = response.daily.time
    .slice(0, 7)
    .map((dateStr, index) => {
      const date = new Date(dateStr + "T00:00:00");
      const dayIndex = date.getDay(); // 0 = Sunday
      const weatherCode = response.daily.weather_code[index];

      return {
        dayLetter: DAY_LETTERS[dayIndex],
        icon: mapWmoCodeToIcon(weatherCode),
        hi: Math.round(response.daily.temperature_2m_max[index]),
        lo: Math.round(response.daily.temperature_2m_min[index]),
        precipitation: response.daily.precipitation_probability_max[index] ?? 0,
        condition: wmoConditionLabel(weatherCode),
        wind: Math.round(response.daily.wind_speed_10m_max[index]),
      };
    });

  // Build date range string from first and last day
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const firstDate = new Date(response.daily.time[0] + "T00:00:00");
  const lastDate = new Date(
    response.daily.time[Math.min(6, response.daily.time.length - 1)] +
      "T00:00:00",
  );
  const dateRange = `${formatter.format(firstDate)} – ${formatter.format(lastDate)}, ${lastDate.getFullYear()}`;

  return { location, dateRange, current, daily };
}
