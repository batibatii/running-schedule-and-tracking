import { Sport } from "@/types/workout";

interface SportIconProps {
  sport: Sport;
  size?: number;
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

  // Default: running
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
      <circle cx="14" cy="5" r="2" />
      <path d="M9 22l2-6 4-3-3-3-3 3-3-1" />
      <path d="M16 13l3 3-2 5" />
    </svg>
  );
}
