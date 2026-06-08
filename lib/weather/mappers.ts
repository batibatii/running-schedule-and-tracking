import type {
  WeatherForecast,
  WeatherIcon,
  CurrentConditions,
  DailyForecast,
} from "./types";

// ---------------------------------------------------------------------------
// OpenWeatherMap One Call API 3.0 response types (subset we use)
// ---------------------------------------------------------------------------

interface OWMWeatherEntry {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface OWMCurrent {
  temp: number;
  feels_like: number;
  wind_speed: number;
  weather: OWMWeatherEntry[];
}

interface OWMDaily {
  /** Unix timestamp (seconds) for the forecasted day. OWM field name: `dt`. */
  unixTimestamp: number;
  temp: { min: number; max: number };
  /** Probability of precipitation, 0–1. */
  pop: number;
  wind_speed: number;
  summary?: string;
  weather: OWMWeatherEntry[];
}

export interface OWMOnecallResponse {
  latitude: number;
  longitude: number;
  current: OWMCurrent;
  daily: OWMDaily[];
}

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/**
 * Map an OpenWeatherMap icon code to our WeatherIcon union.
 *
 * OWM icon codes: https://openweathermap.org/weather-conditions
 *   01d/01n = clear sky
 *   02d/02n = few clouds
 *   03d/03n = scattered clouds
 *   04d/04n = broken clouds
 *   09d/09n = shower rain
 *   10d/10n = rain
 *   11d/11n = thunderstorm
 *   13d/13n = snow
 *   50d/50n = mist
 */
function mapIcon(owmIcon: string): WeatherIcon {
  const code = owmIcon.replace(/[dn]$/, ""); // strip day/night suffix
  switch (code) {
    case "01":
      return "sun";
    case "02":
    case "03":
      return "partly";
    case "04":
      return "cloud";
    case "09":
    case "10":
    case "11":
      return "rain";
    default:
      return "cloud"; // snow, mist, etc. → cloud
  }
}

export function normalizeOWMResponse(raw: {
  lat: number;
  lon: number;
  current: OWMCurrent;
  daily: Array<Omit<OWMDaily, "unixTimestamp"> & { dt: number }>;
}): OWMOnecallResponse {
  return {
    latitude: raw.lat,
    longitude: raw.lon,
    current: raw.current,
    daily: raw.daily.map(({ dt, ...rest }) => ({
      ...rest,
      unixTimestamp: dt,
    })),
  };
}

export function mapOpenWeatherToForecast(
  response: OWMOnecallResponse,
  location: string,
  dateRange: string,
): WeatherForecast {
  const current: CurrentConditions = {
    icon: mapIcon(response.current.weather[0]?.icon ?? "01d"),
    temp: Math.round(response.current.temp),
    feelsLike: Math.round(response.current.feels_like),
    caption:
      response.daily[0]?.summary ??
      response.current.weather[0]?.description ??
      "",
  };

  const daily: DailyForecast[] = response.daily.slice(0, 7).map((day) => {
    const date = new Date(day.unixTimestamp * 1000);
    const dayIndex = date.getDay(); // 0 = Sunday
    return {
      dayLetter: DAY_LETTERS[dayIndex],
      icon: mapIcon(day.weather[0]?.icon ?? "01d"),
      hi: Math.round(day.temp.max),
      lo: Math.round(day.temp.min),
      precipitation: Math.round(day.pop * 100),
      condition: day.weather[0]?.description ?? "",
      wind: Math.round(day.wind_speed * 3.6), // m/s → km/h
    };
  });

  return { location, dateRange, current, daily };
}
