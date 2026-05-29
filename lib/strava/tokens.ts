import { z } from "zod";
import { getStravaTokensByUserId, updateStravaTokens } from "@/lib/dal/strava";
import { extractErrorMessage } from "@/lib/utils/error";

const stravaTokenResponseSchema = z.object({
  token_type: z.string(),
  expires_at: z.number(),
  expires_in: z.number(),
  refresh_token: z.string(),
  access_token: z.string(),
  athlete: z
    .object({
      id: z.number(),
      firstname: z.string(),
      lastname: z.string(),
      profile: z.string(),
      profile_medium: z.string(),
    })
    .optional(),
});

const STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

/**
 * Per-user mutex to prevent concurrent token refreshes.
 * Strava rotates refresh tokens on every refresh — if two concurrent requests
 * both find the token expired, the second would use an already-invalidated
 * refresh token. This map coalesces concurrent refreshes into a single request.
 */
const refreshInFlight = new Map<string, Promise<string>>();

/**
 * Returns a valid (non-expired) Strava access token for the given user.
 * Refreshes the token if it has expired or is about to expire,
 * and persists the new tokens in the accounts table.
 */
export async function getValidStravaToken(userId: string): Promise<string> {
  const tokens = await getStravaTokensByUserId(userId);
  if (!tokens) {
    throw new Error("Strava account not connected");
  }

  const now = Math.floor(Date.now() / 1000);
  const isExpired = tokens.expiresAt < now + TOKEN_EXPIRY_BUFFER_SECONDS;

  if (!isExpired) {
    return tokens.accessToken;
  }

  // If a refresh is already in-flight for this user, wait for it
  const existing = refreshInFlight.get(userId);
  if (existing) {
    return existing;
  }

  const refreshPromise = performRefresh(userId, tokens.refreshToken);
  refreshInFlight.set(userId, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    refreshInFlight.delete(userId);
  }
}

async function performRefresh(
  userId: string,
  refreshToken: string,
): Promise<string> {
  try {
    const refreshed = await refreshStravaToken(refreshToken);

    // Persist new tokens — Strava rotates refresh tokens on every refresh
    await updateStravaTokens(userId, {
      accessToken: refreshed.access_token,
      refreshToken: refreshed.refresh_token,
      expiresAt: refreshed.expires_at,
    });

    return refreshed.access_token;
  } catch (error) {
    throw new Error(
      `Failed to refresh Strava token: ${extractErrorMessage(error)}`,
    );
  }
}

/**
 * Exchange a refresh token for a new access token via the Strava OAuth endpoint.
 * Strava returns a NEW refresh token on every call — the old one becomes invalid.
 */
async function refreshStravaToken(
  refreshToken: string,
): Promise<z.infer<typeof stravaTokenResponseSchema>> {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const clientSecret = process.env.STRAVA_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET must be set");
  }

  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Strava API ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return stravaTokenResponseSchema.parse(data);
}
