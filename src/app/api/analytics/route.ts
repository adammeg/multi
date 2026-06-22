import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { analyticsService } from "@/features/admin/services/admin.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const type = request.nextUrl.searchParams.get("type") ?? "dashboard";
    const days = parseInt(request.nextUrl.searchParams.get("days") ?? "30", 10);

    switch (type) {
      case "views":
        return successResponse(await analyticsService.getViewsOverTime(user.userId, days));
      case "engagement":
        return successResponse(await analyticsService.getEngagementOverTime(user.userId, days));
      default:
        return successResponse(await analyticsService.getDashboardStats(user.userId));
    }
  } catch (error) {
    return handleApiError(error);
  }
}
