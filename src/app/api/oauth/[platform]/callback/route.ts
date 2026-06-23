import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/middleware/auth.middleware";
import { oauthService } from "@/features/platforms/services/oauth.service";
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
  const tiktokError = request.nextUrl.searchParams.get("error");
  const tiktokErrorDesc = request.nextUrl.searchParams.get("error_description");

  if (tiktokError) {
    const detail =
      tiktokError === "access_denied"
        ? "tiktok_denied"
        : encodeURIComponent(tiktokErrorDesc ?? tiktokError);
    return settingsRedirect(`error=oauth_failed&error_detail=${detail}`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return settingsRedirect("error=oauth_failed&error_detail=missing_code_or_state");
  }

  try {
    await withDb();
    await oauthService.handleCallback(platform as Platform, code, state);
    return settingsRedirect(`connected=${platform}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error(`[oauth/${platform}/callback]`, message);
    return settingsRedirect(`error=oauth_failed&error_detail=${encodeURIComponent(message)}`);
  }
}
