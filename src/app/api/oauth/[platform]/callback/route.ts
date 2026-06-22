import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/middleware/auth.middleware";
import { oauthService } from "@/features/platforms/services/oauth.service";
import { getAppBaseUrl } from "@/lib/config/oauth-urls";
import type { Platform } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    await withDb();
    const { platform } = await params;
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(`${getAppBaseUrl()}/dashboard/settings?error=oauth_failed`);
    }

    await oauthService.handleCallback(platform as Platform, code, state);
    return NextResponse.redirect(`${getAppBaseUrl()}/dashboard/settings?connected=${platform}`);
  } catch {
    return NextResponse.redirect(`${getAppBaseUrl()}/dashboard/settings?error=oauth_failed`);
  }
}
