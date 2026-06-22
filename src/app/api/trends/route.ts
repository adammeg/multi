import { NextRequest } from "next/server";
import { withDb } from "@/lib/middleware/auth.middleware";
import { trendService } from "@/features/trends/services/trend.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import type { TrendCategory } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await withDb();
    const country = request.nextUrl.searchParams.get("country") ?? "TN";
    const categoryParam = request.nextUrl.searchParams.get("category");
    const category = categoryParam as TrendCategory | undefined;
    const trends = await trendService.getTrends(country, category);
    return successResponse(trends);
  } catch (error) {
    return handleApiError(error);
  }
}
