"use server";

import { requireAuth } from "@/lib/auth";
import { getStravaTokensByUserId, deleteStravaAccount } from "@/lib/dal/strava";
import { syncRecentActivities } from "@/lib/strava/sync";
import { extractErrorMessage } from "@/lib/utils/error";
import type { ActionResult } from "@/lib/utils/error";

export async function syncStravaAction(): Promise<
  ActionResult<{ synced: number }>
> {
  try {
    const user = await requireAuth();
    const tokens = await getStravaTokensByUserId(user.id);

    if (!tokens) {
      return { success: false, message: "Strava not connected" };
    }

    const result = await syncRecentActivities(user.id, 30);
    return {
      success: true,
      message: `Synced ${result.synced} activities`,
      data: { synced: result.synced },
    };
  } catch (error) {
    console.error("[syncStravaAction]", extractErrorMessage(error));
    return { success: false, message: "Failed to sync Strava activities" };
  }
}

export async function disconnectStravaAction(): Promise<ActionResult> {
  try {
    const user = await requireAuth();
    const tokens = await getStravaTokensByUserId(user.id);

    if (!tokens) {
      return { success: false, message: "Strava not connected" };
    }

    // Revoke access on Strava's side
    await fetch("https://www.strava.com/oauth/deauthorize", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    // Remove the account link from our database
    await deleteStravaAccount(user.id);

    return { success: true, message: "Strava disconnected" };
  } catch (error) {
    console.error("[disconnectStravaAction]", extractErrorMessage(error));
    return { success: false, message: "Failed to disconnect Strava" };
  }
}
