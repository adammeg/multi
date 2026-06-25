import { PlatformContent, IPlatformContent } from "@/lib/db/models";
import type { Platform } from "@/types";

export class PlatformContentRepository {
  async upsertMany(
    userId: string,
    connectedAccountId: string,
    platform: Platform,
    items: Partial<IPlatformContent>[]
  ): Promise<IPlatformContent[]> {
    const results: IPlatformContent[] = [];

    for (const item of items) {
      const doc = await PlatformContent.findOneAndUpdate(
        { connectedAccountId, externalId: item.externalId },
        {
          ...item,
          userId: userId as unknown as import("mongoose").Types.ObjectId,
          connectedAccountId: connectedAccountId as unknown as import("mongoose").Types.ObjectId,
          platform,
          lastSyncedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      results.push(doc);
    }

    return results;
  }

  async findByUserId(
    userId: string,
    platform?: Platform,
    limit = 50
  ): Promise<IPlatformContent[]> {
    const filter: Record<string, unknown> = {
      userId,
      externalId: { $not: /^demo_/ },
    };
    if (platform) filter.platform = platform;
    return PlatformContent.find(filter)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate("connectedAccountId", "platformUsername platform");
  }

  async findById(id: string): Promise<IPlatformContent | null> {
    return PlatformContent.findById(id);
  }

  async updateAnalysis(
    id: string,
    viralScore: number,
    analysis: IPlatformContent["analysis"]
  ): Promise<IPlatformContent | null> {
    return PlatformContent.findByIdAndUpdate(
      id,
      { viralScore, analysis, engagementRate: analysis ? undefined : undefined },
      { new: true }
    );
  }

  async bulkUpdateScores(
    updates: { id: string; viralScore: number; engagementRate: number; analysis: IPlatformContent["analysis"] }[]
  ): Promise<void> {
    const ops = updates.map((u) => ({
      updateOne: {
        filter: { _id: u.id },
        update: {
          $set: {
            viralScore: u.viralScore,
            engagementRate: u.engagementRate,
            analysis: u.analysis,
          },
        },
      },
    }));
    if (ops.length > 0) await PlatformContent.bulkWrite(ops);
  }

  async getStatsByUser(userId: string) {
    return PlatformContent.aggregate([
      { $match: { userId: userId as unknown as import("mongoose").Types.ObjectId, externalId: { $not: /^demo_/ } } },
      {
        $group: {
          _id: "$platform",
          videoCount: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalEngagement: {
            $sum: { $add: ["$likes", "$comments", "$shares", "$saves"] },
          },
          avgEngagement: { $avg: "$engagementRate" },
          avgViralScore: { $avg: "$viralScore" },
        },
      },
    ]);
  }

  async getUserTotals(userId: string) {
    const [result] = await PlatformContent.aggregate([
      { $match: { userId: userId as unknown as import("mongoose").Types.ObjectId, externalId: { $not: /^demo_/ } } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: "$views" },
          totalEngagement: {
            $sum: { $add: ["$likes", "$comments", "$shares", "$saves"] },
          },
          videoCount: { $sum: 1 },
        },
      },
    ]);
    return result ?? { totalViews: 0, totalEngagement: 0, videoCount: 0 };
  }

  async getMetricsOverTime(userId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return PlatformContent.aggregate([
      {
        $match: {
          userId: userId as unknown as import("mongoose").Types.ObjectId,
          publishedAt: { $gte: since },
          externalId: { $not: /^demo_/ },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" } },
          views: { $sum: "$views" },
          engagement: {
            $sum: { $add: ["$likes", "$comments", "$shares", "$saves"] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}

export const platformContentRepository = new PlatformContentRepository();
