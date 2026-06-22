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
      return { synced: 0, accounts: 0, message: "No connected accounts. Connect platforms in Settings." };
    }

    let totalSynced = 0;

    for (const account of accounts) {
      const videos = await platformContentFetcher.fetchWithAccount(account);

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
    }

    await contentAnalysisService.analyzeAllUserContent(userId);

    return {
      synced: totalSynced,
      accounts: accounts.length,
      message: `Synced ${totalSynced} videos from ${accounts.length} account(s)`,
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
