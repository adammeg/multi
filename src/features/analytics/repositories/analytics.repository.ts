import { Analytics, IAnalytics, Trend, ITrend, ActivityLog, IActivityLog } from "@/lib/db/models";
import type { TrendCategory } from "@/types";

export class AnalyticsRepository {
  async create(data: Partial<IAnalytics>): Promise<IAnalytics> {
    return Analytics.create(data);
  }

  async findByUserId(userId: string, days = 30): Promise<IAnalytics[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return Analytics.find({ userId, recordedAt: { $gte: since } }).sort({ recordedAt: 1 });
  }

  async aggregateByPlatform(userId: string): Promise<
    { _id: string; totalViews: number; totalEngagement: number }[]
  > {
    return Analytics.aggregate([
      { $match: { userId: userId as unknown as import("mongoose").Types.ObjectId } },
      {
        $group: {
          _id: "$platform",
          totalViews: { $sum: "$views" },
          totalEngagement: {
            $sum: { $add: ["$likes", "$comments", "$shares", "$saves"] },
          },
        },
      },
    ]);
  }

  async getTotals(userId: string): Promise<{ views: number; engagement: number }> {
    const result = await Analytics.aggregate([
      { $match: { userId: userId as unknown as import("mongoose").Types.ObjectId } },
      {
        $group: {
          _id: null,
          views: { $sum: "$views" },
          engagement: {
            $sum: { $add: ["$likes", "$comments", "$shares", "$saves"] },
          },
        },
      },
    ]);
    return result[0] ?? { views: 0, engagement: 0 };
  }
}

export class TrendRepository {
  async upsertMany(trends: Partial<ITrend>[]): Promise<void> {
    const ops = trends.map((t) => ({
      updateOne: {
        filter: { name: t.name, platform: t.platform, country: t.country ?? "TN" },
        update: { $set: t },
        upsert: true,
      },
    }));
    if (ops.length > 0) await Trend.bulkWrite(ops);
  }

  async findLatest(country = "TN", limit = 50): Promise<ITrend[]> {
    return Trend.find({ country }).sort({ growthPercent: -1 }).limit(limit);
  }

  async findByCategory(category: TrendCategory, country = "TN"): Promise<ITrend[]> {
    return Trend.find({ category, country }).sort({ growthPercent: -1 }).limit(20);
  }

  async getLastFetchedAt(country = "TN"): Promise<Date | null> {
    const latest = await Trend.findOne({ country }).sort({ fetchedAt: -1 }).select("fetchedAt");
    return latest?.fetchedAt ?? null;
  }

  async countByCountry(country = "TN"): Promise<number> {
    return Trend.countDocuments({ country });
  }
}

export class ActivityLogRepository {
  async create(data: Partial<IActivityLog>): Promise<IActivityLog> {
    return ActivityLog.create(data);
  }

  async findRecent(limit = 100): Promise<IActivityLog[]> {
    return ActivityLog.find().sort({ createdAt: -1 }).limit(limit);
  }

  async findByUserId(userId: string, limit = 50): Promise<IActivityLog[]> {
    return ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }
}

export const analyticsRepository = new AnalyticsRepository();
export const trendRepository = new TrendRepository();
export const activityLogRepository = new ActivityLogRepository();
