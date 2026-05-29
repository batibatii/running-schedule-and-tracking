import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

/**
 * GET /api/strava/connect
 *
 * Initiates the Strava OAuth flow for an already-authenticated user.
 * Stores the user's ID in the `state` parameter so the callback
 * can link the Strava account to the correct user instead of creating
 * a new one (NextAuth's default behavior when email is null).
 */
export async function GET() {
  const user = await requireAuth();

  const clientId = process.env.STRAVA_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "STRAVA_CLIENT_ID not configured" },
      { status: 500 },
    );
  }

  const callbackUrl = `${process.env.NEXTAUTH_URL}/api/strava/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: callbackUrl,
    scope: "read,activity:read_all",
    state: user.id, // Pass current user ID so callback can link correctly
  });

  return NextResponse.redirect(
    `https://www.strava.com/oauth/authorize?${params.toString()}`,
  );
}
