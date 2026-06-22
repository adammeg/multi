import { userRepository } from "@/features/auth/repositories/user.repository";
import { postRepository } from "@/features/posts/repositories/post.repository";
import { analyticsRepository, activityLogRepository } from "@/features/analytics/repositories/analytics.repository";
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
    const [totals, platformData, postCount, connectedCount] = await Promise.all([
      analyticsRepository.getTotals(userId),
      analyticsRepository.aggregateByPlatform(userId),
      postRepository.countByUser(userId),
      connectedAccountRepository.countByUserId(userId),
    ]);

    const engagementRate =
      totals.views > 0
        ? ((totals.engagement / totals.views) * 100).toFixed(2)
        : "0.00";

    return {
      totalViews: totals.views,
      totalPosts: postCount,
      engagementRate: parseFloat(engagementRate),
      connectedPlatforms: connectedCount,
      platformBreakdown: platformData,
    };
  }

  async getViewsOverTime(userId: string, days = 30) {
    const data = await analyticsRepository.findByUserId(userId, days);
    const grouped: Record<string, number> = {};

    for (const record of data) {
      const date = record.recordedAt.toISOString().split("T")[0];
      grouped[date] = (grouped[date] ?? 0) + record.views;
    }

    return Object.entries(grouped).map(([date, views]) => ({ date, views }));
  }

  async getEngagementOverTime(userId: string, days = 30) {
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
