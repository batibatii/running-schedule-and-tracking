export function paceToMinutes(pace: string): number {
  const [minutes, seconds] = pace.split(":").map(Number);
  const SECONDS_PER_MINUTE = 60;

  return minutes + seconds / SECONDS_PER_MINUTE;
}

export function calculateDuration(distanceKm: number, pace: string): number {
  const paceConvertedToMinutes = paceToMinutes(pace);

  const duration = Math.round(distanceKm * paceConvertedToMinutes);
  return duration;
}

export function minutesToPace(minutes: number): string {
  const wholeMinutes = Math.floor(minutes);
  const remainingSeconds = Math.round((minutes - wholeMinutes) * 60);

  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${wholeMinutes}:${formattedSeconds}`;
}

export function calculatePaceFromDuration(distance: number, duration: number) {
  if (distance === 0) {
    return "";
  }

  const pacePerKm = duration / distance;

  return minutesToPace(pacePerKm);
}
