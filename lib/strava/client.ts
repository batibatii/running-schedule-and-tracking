import { getValidStravaToken } from "./tokens";
import type { StravaDetailedActivity, StravaSummaryActivity } from "./types";

const STRAVA_API_BASE = "https://www.strava.com/api/v3";

/**
 * Generic fetch wrapper for the Strava API.
 * Automatically attaches a valid (auto-refreshed) Bearer token.
 */
async function stravaFetch<T>(
  userId: string,
  path: string,
  options?: RequestInit,
): Promise<T> {
  const accessToken = await getValidStravaToken(userId);

  const response = await fetch(`${STRAVA_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Strava API ${response.status}: ${errorText}`);
  }

  return response.json();
}

export async function getStravaActivity(
  userId: string,
  activityId: number,
): Promise<StravaDetailedActivity> {
  return stravaFetch<StravaDetailedActivity>(
    userId,
    `/activities/${activityId}`,
  );
}

/** Fetch a page of the authenticated athlete's activities. */
export async function listStravaActivities(
  userId: string,
  params: {
    after?: number; // Unix timestamp — only activities after this time
    before?: number; // Unix timestamp — only activities before this time
    page?: number;
    perPage?: number; // Max 200, default 30
  } = {},
): Promise<StravaSummaryActivity[]> {
  const searchParams = new URLSearchParams();
  if (params.after) searchParams.set("after", String(params.after));
  if (params.before) searchParams.set("before", String(params.before));
  if (params.page) searchParams.set("page", String(params.page));
  if (params.perPage) searchParams.set("per_page", String(params.perPage));

  const query = searchParams.toString();
  const path = `/athlete/activities${query ? `?${query}` : ""}`;

  return stravaFetch<StravaSummaryActivity[]>(userId, path);
}
