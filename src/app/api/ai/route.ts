import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { aiService } from "@/features/ai/services/ai.service";
import {
  captionGeneratorSchema,
  hashtagGeneratorSchema,
  viralScoreSchema,
  qualityCheckSchema,
} from "@/features/ai/dto/ai.dto";
import { requirePlan } from "@/lib/middleware/subscription.middleware";
import { handleApiError, parseBody, successResponse } from "@/lib/utils/api-handler";

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const action = request.nextUrl.searchParams.get("action");

    switch (action) {
      case "captions": {
        const dto = await parseBody(request, captionGeneratorSchema);
        return successResponse(await aiService.generateCaptions(dto));
      }
      case "hashtags": {
        const dto = await parseBody(request, hashtagGeneratorSchema);
        return successResponse(await aiService.generateHashtags(dto));
      }
      case "best-time":
        return successResponse(await aiService.getBestPostingTime(user.userId));
      case "quality-check": {
        const dto = await parseBody(request, qualityCheckSchema);
        return successResponse(await aiService.qualityCheck(dto));
      }
      case "viral-score": {
        await requirePlan("PRO", "AGENCY")(user.userId);
        const dto = await parseBody(request, viralScoreSchema);
        return successResponse(await aiService.calculateViralScore(dto));
      }
      case "behavior-analysis": {
        await requirePlan("PRO", "AGENCY")(user.userId);
        return successResponse(await aiService.analyzeUserBehavior(user.userId));
      }
      default:
        return successResponse({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
