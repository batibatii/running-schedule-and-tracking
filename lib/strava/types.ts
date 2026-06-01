import type { Sport } from "@/types/workout";

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/** Response from POST https://www.strava.com/api/v3/oauth/token */
export interface StravaTokenResponse {
  token_type: string;
  expires_at: number; // Unix timestamp (seconds)
  expires_in: number; // Seconds until expiry
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

// ---------------------------------------------------------------------------
// Athlete
// ---------------------------------------------------------------------------

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string; // Avatar URL
  profile_medium: string;
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

/** Summary representation from GET /athlete/activities */
export interface StravaSummaryActivity {
  id: number;
  name: string;
  type: string; // Legacy: "Run", "Ride", "Swim", etc.
  sport_type: string; // Current: "Run", "TrailRun", "MountainBikeRide", etc.
  distance: number; // Meters
  moving_time: number; // Seconds
  elapsed_time: number; // Seconds
  total_elevation_gain: number; // Meters
  start_date: string; // ISO 8601 UTC
  start_date_local: string; // ISO 8601 local
  timezone: string;
  average_speed: number; // m/s
  max_speed: number; // m/s
  has_heartrate: boolean;
  average_heartrate?: number; // BPM
  max_heartrate?: number; // BPM
  calories?: number;
  workout_type?: number;
  trainer: boolean;
  manual: boolean;
  gear_id?: string;
}

/** Detailed representation from GET /activities/{id} */
export interface StravaDetailedActivity extends StravaSummaryActivity {
  description: string | null;
  calories: number;
  device_name?: string;
  average_cadence?: number;
  average_watts?: number;
  average_temp?: number;
  elev_high?: number;
  elev_low?: number;
  pr_count?: number;
  suffer_score?: number;
  laps?: StravaLap[];
  splits_metric?: StravaSplit[];
  gear?: StravaGear;
}

export interface StravaLap {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_index: number;
  end_index: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
}

export interface StravaSplit {
  distance: number;
  elapsed_time: number;
  moving_time: number;
  elevation_difference: number;
  average_speed: number;
  average_heartrate?: number;
  pace_zone: number;
  split: number;
}

export interface StravaGear {
  id: string;
  name: string;
  distance: number;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/** POST body sent by Strava to the webhook callback URL */
export interface StravaWebhookEvent {
  aspect_type: "create" | "update" | "delete";
  event_time: number; // Unix timestamp
  object_id: number; // Activity or athlete ID
  object_type: "activity" | "athlete";
  owner_id: number; // Strava athlete ID
  subscription_id: number;
  updates: Record<string, string>; // e.g. { "title": "New Name" }
}

// ---------------------------------------------------------------------------
// Sport mapping
// ---------------------------------------------------------------------------

/**
 * Maps Strava sport_type / type values to our app's Sport type.
 * Checked in order: sport_type first (more specific), then type (legacy).
 * Unmapped types are skipped (not synced to the app).
 */
export const STRAVA_SPORT_MAP: Record<string, Sport> = {
  // Running
  Run: "running",
  TrailRun: "running",
  VirtualRun: "running",

  // Cycling
  Ride: "cycling",
  MountainBikeRide: "cycling",
  GravelRide: "cycling",
  EBikeRide: "cycling",
  EMountainBikeRide: "cycling",
  VirtualRide: "cycling",
  Velomobile: "cycling",
  Handcycle: "cycling",

  // Swimming
  Swim: "swimming",
};
