import { connectedAccountRepository } from "@/features/platforms/repositories/connected-account.repository";
import { platformContentRepository } from "@/features/content/repositories/platform-content.repository";
import { platformContentFetcher } from "@/features/content/services/platform-content-fetcher.service";
import { contentAnalysisService } from "@/features/content/services/content-analysis.service";
import { ConnectedAccount } from "@/lib/db/models";
import type { PlatformVideoItem } from "@/types";

export class ContentSyncService {
  async syncUserContent(userId: string) {
    const accounts = await connectedAccountRepository.findByUserId(userId);

    if (accounts.length === 0) {
      return {
        synced: 0,
        accounts: 0,
        results: [],
        message: "No connected accounts. Connect platforms in Settings.",
      };
    }

    let totalSynced = 0;
    const results: {
      platform: string;
      username: string;
      count: number;
      error?: string;
    }[] = [];

    for (const account of accounts) {
      const { videos, error } = await platformContentFetcher.fetchWithAccount(account);

      if (error && videos.length === 0) {
        results.push({
          platform: account.platform,
          username: account.platformUsername,
          count: 0,
          error,
        });
        continue;
      }

      const items = videos.map((v: PlatformVideoItem) => ({
        externalId: v.externalId,
        title: v.title,
        caption: v.caption,
        thumbnailUrl: v.thumbnailUrl,
        permalink: v.permalink,
        duration: v.duration,
        publishedAt: v.publishedAt,
        views: v.views,
        likes: v.likes,
        comments: v.comments,
        shares: v.shares,
        saves: v.saves,
        hashtags: v.hashtags ?? [],
        engagementRate: this.calcEngagementRate(v),
      }));

      await platformContentRepository.upsertMany(
        userId,
        account._id.toString(),
        account.platform,
        items
      );

      await ConnectedAccount.findByIdAndUpdate(account._id, {
        lastSyncedAt: new Date(),
      });

      totalSynced += items.length;
      results.push({
        platform: account.platform,
        username: account.platformUsername,
        count: items.length,
        error: error && items.length > 0 ? error : undefined,
      });
    }

    if (totalSynced > 0) {
      await contentAnalysisService.analyzeAllUserContent(userId);
    }

    const failed = results.filter((r) => r.count === 0 && r.error);
    const message =
      totalSynced > 0
        ? `Synced ${totalSynced} video(s) from ${accounts.length} account(s)`
        : failed.length > 0
          ? `Sync failed: ${failed.map((f) => f.error).join("; ")}`
          : "No videos found on connected accounts";

    return {
      synced: totalSynced,
      accounts: accounts.length,
      results,
      message,
    };
  }

  private calcEngagementRate(v: PlatformVideoItem): number {
    if (v.views === 0) {
      const engagement = v.likes + v.comments + v.shares + v.saves;
      return engagement > 0 ? Math.min(100, engagement / 10) : 0;
    }
    const engagement = v.likes + v.comments + v.shares + v.saves;
    return parseFloat(((engagement / v.views) * 100).toFixed(2));
  }
}

export const contentSyncService = new ContentSyncService();
