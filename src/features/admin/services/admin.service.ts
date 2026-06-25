import { userRepository } from "@/features/auth/repositories/user.repository";
import { postRepository } from "@/features/posts/repositories/post.repository";
import { analyticsRepository, activityLogRepository } from "@/features/analytics/repositories/analytics.repository";
import { platformContentRepository } from "@/features/content/repositories/platform-content.repository";
import { Subscription } from "@/lib/db/models";
import { connectedAccountRepository } from "@/features/platforms/repositories/connected-account.repository";
import { trendRepository } from "@/features/analytics/repositories/analytics.repository";

export class AdminService {
  async getOverview() {
    const [totalUsers, totalPosts, failedPosts, subscriptions] = await Promise.all([
      userRepository.count(),
      postRepository.countAll(),
      postRepository.countAll({ status: "FAILED" }),
      Subscription.aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
      ]),
    ]);

    return {
      totalUsers,
      totalPosts,
      failedPosts,
      subscriptionsByPlan: subscriptions,
    };
  }

  async getUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const users = await userRepository.findAll({}, skip, limit);
    const total = await userRepository.count();
    return { users, total, page, limit };
  }

  async getErrorLogs(limit = 100) {
    return activityLogRepository.findRecent(limit);
  }

  async getPlatformHealth() {
    const accounts = await connectedAccountRepository.findByUserId("");
    // In production, check token expiry and API reachability
    return {
      tiktok: { status: "healthy", connectedAccounts: 0 },
      instagram: { status: "healthy", connectedAccounts: 0 },
      facebook: { status: "healthy", connectedAccounts: 0 },
      youtube: { status: "healthy", connectedAccounts: 0 },
    };
  }

  async getTrendMonitoring() {
    return trendRepository.findLatest("TN", 20);
  }
}

export class AnalyticsService {
  async getDashboardStats(userId: string) {
    const [analyticsTotals, contentTotals, platformData, postCount, connectedCount] =
      await Promise.all([
        analyticsRepository.getTotals(userId),
        platformContentRepository.getUserTotals(userId),
        platformContentRepository.getStatsByUser(userId),
        postRepository.countByUser(userId),
        connectedAccountRepository.countByUserId(userId),
      ]);

    const totalViews =
      analyticsTotals.views > 0 ? analyticsTotals.views : contentTotals.totalViews;
    const totalEngagement =
      analyticsTotals.engagement > 0
        ? analyticsTotals.engagement
        : contentTotals.totalEngagement;

    const engagementRate =
      totalViews > 0
        ? parseFloat(((totalEngagement / totalViews) * 100).toFixed(2))
        : 0;

    const platformBreakdown =
      platformData.length > 0
        ? platformData.map((p) => ({
            _id: p._id as string,
            totalViews: p.totalViews as number,
            totalEngagement: p.totalEngagement as number,
            videoCount: p.videoCount as number,
          }))
        : await analyticsRepository.aggregateByPlatform(userId);

    return {
      totalViews,
      totalPosts: postCount,
      syncedVideos: contentTotals.videoCount,
      engagementRate,
      connectedPlatforms: connectedCount,
      platformBreakdown,
      dataSource: contentTotals.videoCount > 0 ? "synced_accounts" : "none",
    };
  }

  async getViewsOverTime(userId: string, days = 30) {
    const contentSeries = await platformContentRepository.getMetricsOverTime(userId, days);
    if (contentSeries.length > 0) {
      return contentSeries.map((r) => ({ date: r._id as string, views: r.views as number }));
    }

    const data = await analyticsRepository.findByUserId(userId, days);
    const grouped: Record<string, number> = {};
    for (const record of data) {
      const date = record.recordedAt.toISOString().split("T")[0];
      grouped[date] = (grouped[date] ?? 0) + record.views;
    }
    return Object.entries(grouped).map(([date, views]) => ({ date, views }));
  }

  async getEngagementOverTime(userId: string, days = 30) {
    const contentSeries = await platformContentRepository.getMetricsOverTime(userId, days);
    if (contentSeries.length > 0) {
      return contentSeries.map((r) => ({
        date: r._id as string,
        engagement: r.engagement as number,
      }));
    }

    const data = await analyticsRepository.findByUserId(userId, days);
    const grouped: Record<string, number> = {};
    for (const record of data) {
      const date = record.recordedAt.toISOString().split("T")[0];
      const engagement = record.likes + record.comments + record.shares;
      grouped[date] = (grouped[date] ?? 0) + engagement;
    }
    return Object.entries(grouped).map(([date, engagement]) => ({ date, engagement }));
  }
}

export const adminService = new AdminService();
export const analyticsService = new AnalyticsService();
