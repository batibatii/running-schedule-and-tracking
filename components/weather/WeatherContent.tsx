"use client";

import {
  WEATHER_GLYPH,
  SunGlyph,
  CloudGlyph,
  Droplet,
} from "@/components/icons/WeatherIcons";
import type { WeatherForecast, DailyForecast } from "@/lib/weather/types";
import { WEATHER_ICON_TINT } from "@/lib/constants/ui";

interface WeatherContentProps {
  forecast: WeatherForecast;
}

export function WeatherContent({ forecast }: WeatherContentProps) {
  const { current, daily } = forecast;

  const CurrentGlyph = WEATHER_GLYPH[current.icon] ?? SunGlyph;

  const allLows = daily.map((day) => day.lo);
  const allHighs = daily.map((day) => day.hi);
  const minLow = Math.min(...allLows);
  const maxHigh = Math.max(...allHighs);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Current conditions ──────────────────────────────────── */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.75">
          {/* Weather icon */}
          <span
            className="inline-flex shrink-0"
            style={{ color: WEATHER_ICON_TINT[current.icon] }}
          >
            <CurrentGlyph size={36} />
          </span>

          {/* Temperature */}
          <div
            className="font-mono leading-none tracking-[-0.02em]"
            style={{
              fontSize: 33,
              fontWeight: 500,
              color: "var(--ink-strong)",
            }}
          >
            {Math.round(current.temp)}°
            <span className="text-ink-faint" style={{ fontSize: 17 }}>
              C
            </span>
          </div>

          {/* RealFeel */}
          <div className="text-ink-soft ml-auto text-right font-mono text-[11px]">
            RealFeel
            <br />
            <span
              className="text-[14px]"
              style={{ color: "var(--ink-strong)" }}
            >
              {Math.round(current.feelsLike)}°
            </span>
          </div>
        </div>

        {/* Caption */}
        <div className="font-display text-ink-soft text-[16px] italic">
          {current.caption}
        </div>
      </div>

      {/* ── 7-day strip ─────────────────────────────────────────── */}
      <div className="border-line grid grid-cols-7 border-t pt-2.75">
        {daily.map((day, index) => (
          <WeatherDayColumn
            key={index}
            day={day}
            minLow={minLow}
            maxHigh={maxHigh}
          />
        ))}
      </div>
    </div>
  );
}

const TEMP_BAR_TRACK_HEIGHT = 34;

interface WeatherDayColumnProps {
  day: DailyForecast;
  minLow: number;
  maxHigh: number;
}

function WeatherDayColumn({ day, minLow, maxHigh }: WeatherDayColumnProps) {
  const DayGlyph = WEATHER_GLYPH[day.icon] ?? CloudGlyph;

  const temperatureSpan = Math.max(1, maxHigh - minLow);
  const barTopOffset =
    ((maxHigh - day.hi) / temperatureSpan) * TEMP_BAR_TRACK_HEIGHT;
  const barBottomOffset =
    ((maxHigh - day.lo) / temperatureSpan) * TEMP_BAR_TRACK_HEIGHT;
  const barFillHeight = Math.max(5, barBottomOffset - barTopOffset);

  const isWet = day.precipitation >= 20;

  return (
    <div className="flex flex-col items-center gap-1.25">
      {/* Day letter */}
      <span className="text-ink-faint font-mono text-[10.5px] font-semibold">
        {day.dayLetter}
      </span>

      {/* Weather icon */}
      <span
        className="inline-flex"
        style={{ color: WEATHER_ICON_TINT[day.icon] }}
      >
        <DayGlyph size={18} />
      </span>

      {/* High temp */}
      <span
        className="font-mono text-xs font-semibold"
        style={{ color: "var(--ink-strong)" }}
      >
        {Math.round(day.hi)}°
      </span>

      {/* Temperature bar */}
      <div
        className="bg-line relative rounded-full"
        style={{ width: 5, height: TEMP_BAR_TRACK_HEIGHT }}
      >
        <div
          className="absolute inset-x-0 rounded-full"
          style={{
            top: barTopOffset,
            height: barFillHeight,
            background:
              "linear-gradient(to bottom, var(--coral-deep), var(--sky))",
          }}
        />
      </div>

      {/* Low temp */}
      <span className="text-ink-faint font-mono text-[11px]">
        {Math.round(day.lo)}°
      </span>

      {/* Precipitation */}
      <span
        className="inline-flex items-center gap-[1.5px] text-[9px]"
        style={{
          color: isWet ? "var(--weather-wet)" : "var(--ink-faint)",
          fontWeight: isWet ? 600 : 400,
        }}
      >
        <Droplet
          size={8}
          color={isWet ? "var(--weather-wet)" : "var(--ink-faint)"}
        />
        <span className="font-mono">{Math.round(day.precipitation)}%</span>
      </span>
    </div>
  );
}
