import { trendRepository } from "@/features/analytics/repositories/analytics.repository";
import type { TrendCategory } from "@/types";

const TUNISIA_TRENDS_SEED = [
  { name: "#Tunisia", category: "other" as TrendCategory, growthPercent: 45 },
  { name: "#Tunis", category: "travel" as TrendCategory, growthPercent: 38 },
  { name: "#Couscous", category: "food" as TrendCategory, growthPercent: 52 },
  { name: "#Djerba", category: "travel" as TrendCategory, growthPercent: 41 },
  { name: "#Ramadan2026", category: "entertainment" as TrendCategory, growthPercent: 67 },
  { name: "#StartupTN", category: "tech" as TrendCategory, growthPercent: 33 },
  { name: "#FootballTN", category: "sports" as TrendCategory, growthPercent: 58 },
  { name: "#ModeTunisienne", category: "fashion" as TrendCategory, growthPercent: 29 },
];

export class TrendService {
  async fetchAndStoreTrends() {
    const trends = [];

    // TikTok Discover (simulated - replace with scraping/API in production)
    for (const seed of TUNISIA_TRENDS_SEED) {
      trends.push({
        name: seed.name,
        growthPercent: seed.growthPercent + Math.random() * 10,
        category: seed.category,
        platform: "tiktok" as const,
        country: "TN",
        language: "fr",
        fetchedAt: new Date(),
      });
    }

    // Google Trends Tunisia (simulated)
    const googleTrends = [
      { name: "Tunisia travel", category: "travel" as TrendCategory, growthPercent: 35 },
      { name: "Tunisian food recipes", category: "food" as TrendCategory, growthPercent: 42 },
      { name: "Esports Tunisia", category: "sports" as TrendCategory, growthPercent: 28 },
    ];

    for (const gt of googleTrends) {
      trends.push({
        ...gt,
        platform: "google" as const,
        country: "TN",
        language: "fr",
        fetchedAt: new Date(),
      });
    }

    await trendRepository.upsertMany(trends);
    return trends;
  }

  async getTrends(country = "TN", category?: TrendCategory) {
    if (category) return trendRepository.findByCategory(category, country);
    return trendRepository.findLatest(country);
  }
}

export const trendService = new TrendService();
