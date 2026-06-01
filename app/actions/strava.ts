"use server";

import { requireAuth } from "@/lib/auth";
import { getStravaTokensByUserId, deleteStravaAccount } from "@/lib/dal/strava";
import { deleteActivityById } from "@/lib/dal/activities";
import { getUserLastSyncedAt, updateLastSyncedAt } from "@/lib/dal/users";
import { getValidStravaToken } from "@/lib/strava/tokens";
import { syncActivitiesForPeriod } from "@/lib/strava/sync";
import { extractErrorMessage } from "@/lib/utils/error";
import type { ActionResult } from "@/lib/utils/error";

/** If the last sync was less than 23 hours ago, only fetch today's activities. */
const CACHE_WINDOW_MS = 23 * 60 * 60 * 1000;
const TODAY_ONLY_DAYS = 1;
const FULL_SYNC_DAYS = 30;

export async function syncStravaAction(): Promise<
  ActionResult<{ synced: number; matched: number; unmatched: number }>
> {
  try {
    const user = await requireAuth();
    const tokens = await getStravaTokensByUserId(user.id);

    if (!tokens) {
      return { success: false, message: "Strava not connected" };
    }

    // Caching: if synced recently, only fetch today's activities
    const lastSyncedAt = await getUserLastSyncedAt(user.id);
    const isCacheStillFresh =
      lastSyncedAt !== null &&
      Date.now() - lastSyncedAt.getTime() < CACHE_WINDOW_MS;
    const syncDays = isCacheStillFresh ? TODAY_ONLY_DAYS : FULL_SYNC_DAYS;

    const result = await syncActivitiesForPeriod(user.id, syncDays);
    await updateLastSyncedAt(user.id);

    return {
      success: true,
      message: `Synced ${result.synced} activities — ${result.matched} matched`,
      data: {
        synced: result.synced,
        matched: result.matched,
        unmatched: result.unmatched,
      },
    };
  } catch (error) {
    console.error("[syncStravaAction]", extractErrorMessage(error));
    return { success: false, message: "Failed to sync Strava activities" };
  }
}

export async function deleteActivityAction(activityId: string) {
  try {
    const user = await requireAuth();
    await deleteActivityById(activityId, user.id);
  } catch (error) {
    console.error("[deleteActivityAction]", extractErrorMessage(error));
    throw error;
  }
}

export async function disconnectStravaAction(): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const tokens = await getStravaTokensByUserId(user.id);

    if (!tokens) {
      return { success: false, message: "Strava not connected" };
    }

    // Get a fresh (auto-refreshed) token before deauthorizing
    const freshToken = await getValidStravaToken(user.id);

    // Revoke access on Strava's side
    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${freshToken}` },
    });

    // Remove the account link from our database
    await deleteStravaAccount(user.id);

    return { success: true, message: "Strava disconnected" };
  } catch (error) {
    console.error("[disconnectStravaAction]", extractErrorMessage(error));
    return { success: false, message: "Failed to disconnect Strava" };
  }
}
