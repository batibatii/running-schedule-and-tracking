export function paceToMinutes(pace: string): number {
  const [minutes, seconds] = pace.split(":").map(Number);
  const SECONDS_PER_MINUTE = 60;

  return minutes + seconds / SECONDS_PER_MINUTE;
}

export function calculateDuration(distanceKm: number, pace: string): number {
  const paceConvertedToMinutes = paceToMinutes(pace);

  const duration = distanceKm * paceConvertedToMinutes;
  return duration;
}

export function minutesToPace(minutes: number): string {
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = (minutes - wholeMinutes) * 60;
  const roundedSeconds = Math.round(remainingSeconds);

  // Handle case where rounding seconds gives us 60
  if (roundedSeconds === 60) {
    return `${wholeMinutes + 1}:00`;
  }

  const formattedSeconds = String(roundedSeconds).padStart(2, "0");

  return `${wholeMinutes}:${formattedSeconds}`;
}

/**
 * Formats decimal minutes to duration format for total workout duration.
 * - Under 60 minutes: MM:SS (e.g., 58:18, 23:45)
 * - 60 minutes or more: H:MM:SS (e.g., 1:48:18, 2:53:33)
 * Example: 58.3 minutes -> "58:18"
 * Example: 108.3 minutes -> "1:48:18"
 */
export function formatDuration(minutes: number): string {
  const totalSeconds = Math.round(minutes * 60);

  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formattedSeconds = String(seconds).padStart(2, "0");

  if (hours > 0) {
    const formattedMinutes = String(remainingMinutes).padStart(2, "0");
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
    return `${remainingMinutes}:${formattedSeconds}`;
  }
}

export function calculatePaceFromDuration(distance: number, duration: number) {
  if (distance === 0) {
    return "";
  }

  const pacePerKm = duration / distance;

  return minutesToPace(pacePerKm);
}
