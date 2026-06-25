import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/middleware/auth.middleware";
import { oauthService } from "@/features/platforms/services/oauth.service";
import { contentSyncService } from "@/features/content/services/content-sync.service";
import { getAppBaseUrl } from "@/lib/config/oauth-urls";
import type { Platform } from "@/types";

function settingsRedirect(query: string) {
  return NextResponse.redirect(`${getAppBaseUrl()}/dashboard/settings?${query}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;
  const oauthError = request.nextUrl.searchParams.get("error");
  const oauthErrorDesc = request.nextUrl.searchParams.get("error_description");

  if (oauthError) {
    let detail: string;
    if (oauthError === "access_denied") {
      if (platform === "youtube") detail = "youtube_access_denied";
      else if (platform === "tiktok") detail = "tiktok_denied";
      else detail = encodeURIComponent(oauthErrorDesc ?? oauthError);
    } else {
      detail = encodeURIComponent(oauthErrorDesc ?? oauthError);
    }
    return settingsRedirect(`error=oauth_failed&error_detail=${detail}`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return settingsRedirect("error=oauth_failed&error_detail=missing_code_or_state");
  }

  try {
    await withDb();
    const account = await oauthService.handleCallback(platform as Platform, code, state);
    try {
      await contentSyncService.syncUserContent(account.userId.toString());
    } catch (syncErr) {
      console.error(`[oauth/${platform}/callback] post-connect sync failed`, syncErr);
    }
    return settingsRedirect(`connected=${platform}&synced=1`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error(`[oauth/${platform}/callback]`, message);
    return settingsRedirect(`error=oauth_failed&error_detail=${encodeURIComponent(message)}`);
  }
}
