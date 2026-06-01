import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { extractErrorMessage } from "@/lib/utils/error";
import { syncActivitiesForPeriod } from "@/lib/strava/sync";

/**
 * GET /api/strava/callback
 *
 * OAuth callback for the custom Strava connect flow.
 * Exchanges the authorization code for tokens and inserts
 * a Strava account row linked to the authenticated user (passed via `state`).
 *
 * This bypasses NextAuth's default adapter flow, which would create
 * a ghost user because Strava doesn't provide an email address.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      new URL("/schedule?strava=error&reason=missing_params", request.url),
    );
  }

  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch(
      "https://www.strava.com/api/v3/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.STRAVA_CLIENT_ID,
          client_secret: process.env.STRAVA_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
        }),
      },
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Strava Callback] Token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/schedule?strava=error&reason=token_exchange", request.url),
      );
    }

    const data = await tokenResponse.json();

    // Insert Strava account linked to the authenticated user
    await db
      .insert(accounts)
      .values({
        userId,
        type: "oauth",
        provider: "strava",
        providerAccountId: String(data.athlete.id),
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: data.expires_at,
        token_type: data.token_type ?? "Bearer",
        scope: "read,activity:read_all",
      })
      .onConflictDoUpdate({
        target: [accounts.provider, accounts.providerAccountId],
        set: {
          userId, // Re-link to current user if account was previously linked
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          updatedAt: new Date(),
        },
      });

    // Fire-and-forget: sync last 30 days after connecting/reconnecting.
    // Not awaited so the redirect happens immediately.
    syncActivitiesForPeriod(userId, 30).catch((error) =>
      console.error(
        "[Strava Callback] Background sync failed:",
        extractErrorMessage(error),
      ),
    );

    return NextResponse.redirect(
      new URL("/schedule?strava=connected", request.url),
    );
  } catch (error) {
    console.error("[Strava Callback] Error:", extractErrorMessage(error));
    return NextResponse.redirect(
      new URL("/schedule?strava=error&reason=server_error", request.url),
    );
  }
}
