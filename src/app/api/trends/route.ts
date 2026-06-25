import { NextRequest } from "next/server";
import { withDb } from "@/lib/middleware/auth.middleware";
import { trendService } from "@/features/trends/services/trend.service";
import { trendRepository } from "@/features/analytics/repositories/analytics.repository";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import type { TrendCategory } from "@/types";

export async function GET(request: NextRequest) {
  try {
    await withDb();
    const country = request.nextUrl.searchParams.get("country") ?? "TN";
    const categoryParam = request.nextUrl.searchParams.get("category");
    const category = categoryParam as TrendCategory | undefined;
    const refresh = request.nextUrl.searchParams.get("refresh") === "1";

    const trends = await trendService.getTrends(country, category, refresh);
    const lastFetchedAt = await trendRepository.getLastFetchedAt(country);

    return successResponse({ trends, lastFetchedAt, country });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await withDb();
    const country =
      request.nextUrl.searchParams.get("country") ??
      (await request.json().catch(() => ({})) as { country?: string }).country ??
      "TN";

    const trends = await trendService.fetchAndStoreTrends(country);
    const lastFetchedAt = await trendRepository.getLastFetchedAt(country);

    return successResponse({
      trends,
      lastFetchedAt,
      country,
      message: `Updated ${trends.length} trend(s) for ${country}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
