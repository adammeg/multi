import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { platformContentRepository } from "@/features/content/repositories/platform-content.repository";
import { contentSyncService } from "@/features/content/services/content-sync.service";
import { contentAnalysisService } from "@/features/content/services/content-analysis.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import type { Platform } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const platform = request.nextUrl.searchParams.get("platform") as Platform | null;
    const section = request.nextUrl.searchParams.get("section");

    if (section === "recommendations") {
      const analysis = await contentAnalysisService.getAccountAnalysis(user.userId);
      return successResponse(analysis);
    }

    const videos = await platformContentRepository.findByUserId(
      user.userId,
      platform ?? undefined
    );

    return successResponse({ videos, count: videos.length });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const result = await contentSyncService.syncUserContent(user.userId);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
