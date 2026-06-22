import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { oauthService } from "@/features/platforms/services/oauth.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import type { Platform } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const platform = request.nextUrl.searchParams.get("platform") as Platform;
    if (!platform) throw new Error("Platform required");
    const url = oauthService.getAuthUrl(platform, user.userId);
    return successResponse({ authUrl: url });
  } catch (error) {
    return handleApiError(error);
  }
}
