export type WeatherIcon = "sun" | "partly" | "rain" | "cloud";

export interface CurrentConditions {
  icon: WeatherIcon;
  temp: number; // °C
  feelsLike: number; // °C
  caption: string; // e.g. "Breezy Sunday afternoon"
}

export interface DailyForecast {
  dayLetter: string; // "M", "T", "W", etc.
  icon: WeatherIcon;
  hi: number; // °C high
  lo: number; // °C low
  precipitation: number; // precipitation chance 0–100
  condition: string; // e.g. "Sunny", "Light rain"
  wind: number; // km/h
}

export interface WeatherForecast {
  location: string; // "Istanbul, TR"
  dateRange: string; // "Jun 2 – Jun 8, 2026"
  current: CurrentConditions;
  daily: DailyForecast[];
}
