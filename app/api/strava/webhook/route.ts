import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStravaTokensByAthleteId } from "@/lib/dal/strava";
import { syncSingleActivity, handleStravaDelete } from "@/lib/strava/sync";
import { extractErrorMessage } from "@/lib/utils/error";

const stravaWebhookEventSchema = z.object({
  aspect_type: z.enum(["create", "update", "delete"]),
  event_time: z.number(),
  object_id: z.number(),
  object_type: z.enum(["activity", "athlete"]),
  owner_id: z.number(),
  subscription_id: z.number(),
  updates: z.record(z.string()).default({}),
});

/**
 * GET /api/strava/webhook
 *
 * Subscription validation — Strava sends this once when you register
 * a webhook subscription. Echo back hub.challenge if the verify token matches.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const challenge = searchParams.get("hub.challenge");
  const verifyToken = searchParams.get("hub.verify_token");

  if (mode === "subscribe" && verifyToken === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/strava/webhook
 *
 * Event processing — Strava sends this for every activity create/update/delete.
 * Must respond 200 within 2 seconds. Always returns 200, even on errors,
 * to prevent Strava retry storms.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = stravaWebhookEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const event = parsed.data;

  // Verify the event came from our registered subscription
  if (
    process.env.STRAVA_SUBSCRIPTION_ID &&
    String(event.subscription_id) !== process.env.STRAVA_SUBSCRIPTION_ID
  ) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 403 },
    );
  }

  // Ignore non-activity events (e.g. athlete deauthorization)
  if (event.object_type !== "activity") {
    return NextResponse.json({ received: true });
  }

  try {
    const tokens = await getStravaTokensByAthleteId(String(event.owner_id));

    if (!tokens) {
      console.warn(
        "[Strava Webhook] No user found for athlete:",
        event.owner_id,
      );
      return NextResponse.json({ received: true });
    }

    if (event.aspect_type === "create" || event.aspect_type === "update") {
      await syncSingleActivity(tokens.userId, event.object_id);
    } else if (event.aspect_type === "delete") {
      await handleStravaDelete(tokens.userId, event.object_id);
    }
  } catch (error) {
    console.error("[Strava Webhook] Processing error:", {
      aspect_type: event.aspect_type,
      object_id: event.object_id,
      owner_id: event.owner_id,
      error: extractErrorMessage(error),
    });
  }

  return NextResponse.json({ received: true });
}
