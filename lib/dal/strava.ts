import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
}

/**
 * Look up Strava tokens by Strava athlete ID (providerAccountId).
 * Used by the webhook handler — Strava sends owner_id (athlete ID),
 * not our internal user ID.
 */
export async function getStravaTokensByAthleteId(
  athleteId: string,
): Promise<StravaTokens | null> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, "strava"),
        eq(accounts.providerAccountId, athleteId),
      ),
    );

  if (!account?.access_token || !account.refresh_token) return null;

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at ?? 0,
    userId: account.userId,
  };
}

/**
 * Look up Strava tokens by internal user ID.
 * Used by server actions and the sync logic when the user is authenticated.
 */
export async function getStravaTokensByUserId(
  userId: string,
): Promise<StravaTokens | null> {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.provider, "strava"), eq(accounts.userId, userId)));

  if (!account?.access_token || !account.refresh_token) return null;

  return {
    accessToken: account.access_token,
    refreshToken: account.refresh_token,
    expiresAt: account.expires_at ?? 0,
    userId: account.userId,
  };
}

/**
 * Update Strava tokens in the accounts table after a token refresh.
 */
export async function updateStravaTokens(
  userId: string,
  tokens: { accessToken: string; refreshToken: string; expiresAt: number },
): Promise<void> {
  await db
    .update(accounts)
    .set({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      expires_at: tokens.expiresAt,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.provider, "strava"), eq(accounts.userId, userId)));
}

export async function deleteStravaAccount(userId: string): Promise<void> {
  await db
    .delete(accounts)
    .where(and(eq(accounts.provider, "strava"), eq(accounts.userId, userId)));
}
