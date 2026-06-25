import axios from "axios";
import { trendRepository } from "@/features/analytics/repositories/analytics.repository";
import { platformContentRepository } from "@/features/content/repositories/platform-content.repository";
import { oauthTokenRepository } from "@/features/platforms/repositories/connected-account.repository";
import { decrypt } from "@/lib/crypto/encryption";
import type { Platform, TrendCategory } from "@/types";

const STALE_MS = 6 * 60 * 60 * 1000;

type TrendInput = {
  name: string;
  growthPercent: number;
  category: TrendCategory;
  platform: Platform | "google";
  country: string;
  language: string;
  metadata?: Record<string, unknown>;
  fetchedAt: Date;
};

const TUNISIA_FALLBACK: Omit<TrendInput, "fetchedAt">[] = [
  { name: "#Tunisia", category: "other", growthPercent: 45, platform: "tiktok", country: "TN", language: "fr" },
  { name: "#Tunis", category: "travel", growthPercent: 38, platform: "tiktok", country: "TN", language: "fr" },
  { name: "#Couscous", category: "food", growthPercent: 52, platform: "tiktok", country: "TN", language: "fr" },
  { name: "#Djerba", category: "travel", growthPercent: 41, platform: "tiktok", country: "TN", language: "fr" },
  { name: "#StartupTN", category: "tech", growthPercent: 33, platform: "tiktok", country: "TN", language: "fr" },
  { name: "#FootballTN", category: "sports", growthPercent: 58, platform: "tiktok", country: "TN", language: "fr" },
];

function inferCategory(name: string): TrendCategory {
  const lower = name.toLowerCase();
  if (/food|recipe|cuisine|couscous|restaurant|مطبخ|طعام/.test(lower)) return "food";
  if (/travel|tour|djerba|trip|hotel|سفر/.test(lower)) return "travel";
  if (/fashion|mode|style|beauty|موضة/.test(lower)) return "fashion";
  if (/tech|startup|code|ai|تكنولوجيا/.test(lower)) return "tech";
  if (/sport|football|match|كرة/.test(lower)) return "sports";
  if (/learn|education|course|تعليم/.test(lower)) return "education";
  if (/music|film|movie|entertainment|فن/.test(lower)) return "entertainment";
  return "other";
}

function trafficToGrowth(traffic: string): number {
  const num = parseInt(traffic.replace(/[^0-9]/g, ""), 10);
  if (!num) return 20;
  return Math.min(98, Math.max(18, Math.round(Math.log10(num + 1) * 22)));
}

function viewsToGrowth(views: number, count: number): number {
  const score = Math.log10(views + 1) * 12 + count * 3;
  return Math.min(95, Math.max(12, Math.round(score)));
}

export class TrendService {
  async getTrends(country = "TN", category?: TrendCategory, forceRefresh = false) {
    const [count, lastFetched] = await Promise.all([
      trendRepository.countByCountry(country),
      trendRepository.getLastFetchedAt(country),
    ]);

    const isStale = !lastFetched || Date.now() - lastFetched.getTime() > STALE_MS;
    if (forceRefresh || count === 0 || isStale) {
      try {
        await this.fetchAndStoreTrends(country);
      } catch (err) {
        console.error("[trends] refresh failed:", err);
        if (count === 0) {
          await trendRepository.upsertMany(
            TUNISIA_FALLBACK.map((t) => ({ ...t, country, fetchedAt: new Date() }))
          );
        }
      }
    }

    if (category) return trendRepository.findByCategory(category, country);
    return trendRepository.findLatest(country);
  }

  async fetchAndStoreTrends(country = "TN") {
    const fetchedAt = new Date();
    const results = await Promise.allSettled([
      this.fetchGoogleTrendsRss(country, fetchedAt),
      this.fetchYouTubeTrending(country, fetchedAt),
      this.fetchContentHashtagTrends(country, fetchedAt),
    ]);

    const trends: TrendInput[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") trends.push(...result.value);
    }

    if (trends.length === 0) {
      trends.push(
        ...TUNISIA_FALLBACK.map((t) => ({ ...t, country, fetchedAt }))
      );
    }

    await trendRepository.upsertMany(trends);
    return trends;
  }

  private async fetchGoogleTrendsRss(country: string, fetchedAt: Date): Promise<TrendInput[]> {
    const res = await axios.get(`https://trends.google.com/trending/rss?geo=${country}`, {
      timeout: 12000,
      headers: {
        "User-Agent": "MultiPosterTN/1.0",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      responseType: "text",
    });

    const xml = String(res.data);
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

    return items.slice(0, 15).map((item) => {
      const title = item.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)?.[1]?.trim() ?? "Trend";
      const traffic =
        item.match(/<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/)?.[1]?.trim() ??
        item.match(/<approx_traffic>([\s\S]*?)<\/approx_traffic>/)?.[1]?.trim() ??
        "";

      return {
        name: title,
        growthPercent: trafficToGrowth(traffic),
        category: inferCategory(title),
        platform: "google" as const,
        country,
        language: "fr",
        metadata: { traffic: traffic || undefined, source: "google_trends_rss" },
        fetchedAt,
      };
    });
  }

  private async fetchYouTubeTrending(country: string, fetchedAt: Date): Promise<TrendInput[]> {
    const { ConnectedAccount } = await import("@/lib/db/models");
    const youtubeAccount = await ConnectedAccount.findOne({
      platform: "youtube",
      isActive: true,
    });

    if (!youtubeAccount) return [];

    const tokenDoc = await oauthTokenRepository.findByAccountId(youtubeAccount._id.toString());
    if (!tokenDoc) return [];

    const accessToken = decrypt(tokenDoc.accessTokenEncrypted);
    const res = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,statistics",
        chart: "mostPopular",
        regionCode: country,
        maxResults: 12,
      },
      headers: { Authorization: `Bearer ${accessToken}` },
      timeout: 12000,
    });

    const items = res.data?.items ?? [];
    const maxViews = Math.max(
      ...items.map((v: { statistics?: { viewCount?: string } }) =>
        parseInt(v.statistics?.viewCount ?? "0", 10)
      ),
      1
    );

    return items.map((v: {
      id: string;
      snippet?: { title?: string; tags?: string[] };
      statistics?: { viewCount?: string };
    }) => {
      const views = parseInt(v.statistics?.viewCount ?? "0", 10);
      const title = v.snippet?.title ?? "YouTube trend";
      return {
        name: title,
        growthPercent: Math.min(99, Math.round((views / maxViews) * 85) + 10),
        category: inferCategory(title),
        platform: "youtube" as const,
        country,
        language: "fr",
        metadata: {
          videoId: v.id,
          views,
          source: "youtube_most_popular",
          url: `https://youtube.com/watch?v=${v.id}`,
        },
        fetchedAt,
      };
    });
  }

  private async fetchContentHashtagTrends(country: string, fetchedAt: Date): Promise<TrendInput[]> {
    const rows = await platformContentRepository.aggregateHashtagTrends(20);
    if (rows.length === 0) return [];

    const maxViews = Math.max(...rows.map((r) => (r.totalViews as number) ?? 0), 1);

    return rows.map((row) => {
      const tag = String(row._id);
      const views = (row.totalViews as number) ?? 0;
      const count = (row.count as number) ?? 1;
      const platforms = (row.platforms as Platform[]) ?? ["tiktok"];

      return {
        name: tag.startsWith("#") ? tag : `#${tag}`,
        growthPercent: viewsToGrowth(views, count),
        category: inferCategory(tag),
        platform: platforms[0] ?? "tiktok",
        country,
        language: "fr",
        metadata: {
          videoCount: count,
          totalViews: views,
          platforms,
          source: "synced_content",
        },
        fetchedAt,
      };
    });
  }
}

export const trendService = new TrendService();
