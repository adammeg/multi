import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/middleware/auth.middleware";
import { adminService } from "@/features/admin/services/admin.service";
import { subscriptionRepository } from "@/features/subscription/repositories/subscription.repository";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    await withAdmin(request);
    const section = request.nextUrl.searchParams.get("section") ?? "overview";

    switch (section) {
      case "users": {
        const page = parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10);
        return successResponse(await adminService.getUsers(page));
      }
      case "errors":
        return successResponse(await adminService.getErrorLogs());
      case "platforms":
        return successResponse(await adminService.getPlatformHealth());
      case "trends":
        return successResponse(await adminService.getTrendMonitoring());
      default:
        return successResponse(await adminService.getOverview());
    }
  } catch (error) {
    return handleApiError(error);
  }
}

const updatePlanSchema = z.object({
  userId: z.string(),
  plan: z.enum(["FREE", "PRO", "AGENCY"]),
});

export async function PUT(request: NextRequest) {
  try {
    await withAdmin(request);
    const body = updatePlanSchema.parse(await request.json());
    const sub = await subscriptionRepository.updatePlan(body.userId, body.plan);
    return successResponse(sub);
  } catch (error) {
    return handleApiError(error);
  }
}
