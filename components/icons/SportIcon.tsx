import { Sport } from "@/types/workout";

interface IconProps {
  size?: number;
  className?: string;
}

interface SportIconProps {
  sport: Sport;
  size?: number;
}

/** Standalone sprinter glyph — used in logo lockup and as the running sport icon. */
export function RunIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="16" cy="4.5" r="1.8" />
      <path d="M6 20 L11 13 L14 10 L18 11" />
      <path d="M14 10 L12 7 L8 7" />
      <path d="M11 13 L14 16 L13 20" />
    </svg>
  );
}

export function SportIcon({ sport, size = 14 }: SportIconProps) {
  if (sport === "cycling") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="6" cy="17" r="4" />
        <circle cx="18" cy="17" r="4" />
        <path d="M6 17l4-9h4l4 9" />
        <circle cx="14" cy="5" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (sport === "swimming") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 18c2 0 2-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5" />
        <path d="M2 13c2 0 2-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5" />
        <circle cx="16" cy="7" r="2" />
        <path d="M5 11l5-3 4 2" />
      </svg>
    );
  }

  // Default: running (sprinter glyph)
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="16" cy="4.5" r="1.8" />
      <path d="M6 20 L11 13 L14 10 L18 11" />
      <path d="M14 10 L12 7 L8 7" />
      <path d="M11 13 L14 16 L13 20" />
    </svg>
  );
}
