import { getStravaTokensByUserId, updateStravaTokens } from "@/lib/dal/strava";
import { extractErrorMessage } from "@/lib/utils/error";
import type { StravaTokenResponse } from "./types";

const STRAVA_TOKEN_URL = "https://www.strava.com/api/v3/oauth/token";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

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

  try {
    const refreshed = await refreshStravaToken(tokens.refreshToken);

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
): Promise<StravaTokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Strava API ${response.status}: ${errorText}`);
  }

  return response.json();
}
