import type { WeatherIcon } from "@/lib/weather/types";

interface IconProps {
  size?: number;
  color?: string;
}

export function SunGlyph({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function CloudGlyph({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 19a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 11.4 4 4 0 0 0 7 19z" />
    </svg>
  );
}

export function PartlyGlyph({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 4V2.6M3.8 5.8l-1-1M3 10H1.6M12.2 5.8l1-1M12.5 10.5a4 4 0 1 0-7.4-2.2" />
      <path d="M16.5 20a4 4 0 0 0 .4-7.98A5 5 0 0 0 7.2 13.2 3.5 3.5 0 0 0 7.5 20z" />
    </svg>
  );
}

export function RainGlyph({ size = 20, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.5 14a4.5 4.5 0 0 0 .5-8.97A6 6 0 0 0 6.34 6.4 4 4 0 0 0 7 14" />
      <path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" />
    </svg>
  );
}

export function Droplet({ size = 10, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3z" />
    </svg>
  );
}

export function Sparkle({ size = 14, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 2.6l1.7 5.4a4 4 0 0 0 2.6 2.6l5.4 1.7-5.4 1.7a4 4 0 0 0-2.6 2.6L12 22l-1.7-5.4a4 4 0 0 0-2.6-2.6L2.3 12.3l5.4-1.7a4 4 0 0 0 2.6-2.6z" />
    </svg>
  );
}

export function RefreshIcon({ size = 13, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v5h-5" />
    </svg>
  );
}

export function CloseIcon({ size = 16, color = "currentColor" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export const WEATHER_GLYPH: Record<
  WeatherIcon,
  React.ComponentType<IconProps>
> = {
  sun: SunGlyph,
  cloud: CloudGlyph,
  partly: PartlyGlyph,
  rain: RainGlyph,
};
