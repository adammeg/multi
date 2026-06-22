import { platformContentRepository } from "@/features/content/repositories/platform-content.repository";
import { aiService } from "@/features/ai/services/ai.service";
import type { IPlatformContent } from "@/lib/db/models";
import type { AccountContentAnalysis, Platform, ViralRecommendation } from "@/types";

export class ContentAnalysisService {
  async analyzeAllUserContent(userId: string) {
    const videos = await platformContentRepository.findByUserId(userId, undefined, 100);

    if (videos.length === 0) return;

    const avgViews = videos.reduce((s, v) => s + v.views, 0) / videos.length;
    const avgEngagement =
      videos.reduce((s, v) => s + v.engagementRate, 0) / videos.length;

    const updates = videos.map((video) => {
      const { viralScore, analysis, engagementRate } = this.scoreVideo(
        video,
        avgViews,
        avgEngagement
      );
      return {
        id: video._id.toString(),
        viralScore,
        engagementRate,
        analysis,
      };
    });

    await platformContentRepository.bulkUpdateScores(updates);
  }

  scoreVideo(
    video: IPlatformContent,
    avgViews: number,
    avgEngagement: number
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    let score = 40;

    const engagement = video.likes + video.comments + video.shares + video.saves;
    const engagementRate =
      video.views > 0
        ? parseFloat(((engagement / video.views) * 100).toFixed(2))
        : video.engagementRate;

    if (video.views > avgViews * 1.5) {
      score += 20;
      strengths.push("Above-average views for your account");
    } else if (video.views < avgViews * 0.5) {
      score -= 10;
      weaknesses.push("Below your average view count");
      recommendations.push("Try a stronger hook in the first 2 seconds");
    }

    if (engagementRate > avgEngagement * 1.3) {
      score += 15;
      strengths.push("High engagement rate");
    } else if (engagementRate < avgEngagement * 0.7) {
      weaknesses.push("Low engagement relative to views");
      recommendations.push("Add a clear CTA (comment, share, save)");
    }

    if (video.duration && video.duration >= 15 && video.duration <= 45) {
      score += 10;
      strengths.push("Optimal duration (15-45s)");
    } else if (video.duration && video.duration > 60) {
      weaknesses.push("Video may be too long for short-form");
      recommendations.push("Trim to under 60 seconds");
    } else if (video.duration && video.duration < 10) {
      recommendations.push("Consider 15-30s for better retention");
    }

    if (video.hashtags.length >= 3 && video.hashtags.length <= 10) {
      score += 8;
      strengths.push("Good hashtag usage");
    } else if (video.hashtags.length < 2) {
      weaknesses.push("Few hashtags");
      recommendations.push("Add 5-8 Tunisia-relevant hashtags");
    }

    const hour = new Date(video.publishedAt).getHours();
    if (hour >= 18 && hour <= 22) {
      score += 7;
      strengths.push("Posted during peak Tunisia hours");
    } else {
      recommendations.push("Repost or schedule at 7-9 PM for Tunisia audience");
    }

    if (video.comments > video.likes * 0.05) {
      score += 5;
      strengths.push("Strong comment engagement");
    }

    score = Math.min(100, Math.max(0, score));

    return {
      viralScore: score,
      engagementRate,
      analysis: { strengths, weaknesses, recommendations },
    };
  }

  async getAccountAnalysis(userId: string): Promise<AccountContentAnalysis> {
    const videos = await platformContentRepository.findByUserId(userId, undefined, 100);

    if (videos.length === 0) {
      return {
        totalVideos: 0,
        totalViews: 0,
        avgEngagementRate: 0,
        topPerformers: [],
        underperformers: [],
        recommendations: this.getDefaultRecommendations(),
        bestPostingDay: "Friday",
        bestPostingHour: 19,
        platformInsights: {},
      };
    }

    const totalViews = videos.reduce((s, v) => s + v.views, 0);
    const avgEngagementRate =
      videos.reduce((s, v) => s + (v.engagementRate ?? 0), 0) / videos.length;

    const sorted = [...videos].sort((a, b) => (b.viralScore ?? 0) - (a.viralScore ?? 0));

    const topPerformers = sorted.slice(0, 3).map((v) => ({
      title: v.title,
      platform: v.platform as Platform,
      viralScore: v.viralScore ?? 0,
      views: v.views,
    }));

    const underperformers = sorted
      .slice(-3)
      .reverse()
      .filter((v) => (v.viralScore ?? 0) < 60)
      .map((v) => ({
        title: v.title,
        platform: v.platform as Platform,
        viralScore: v.viralScore ?? 0,
        recommendations: v.analysis?.recommendations ?? [],
      }));

    const { bestDay, bestHour } = this.calcBestPostingTime(videos);
    const platformInsights = this.calcPlatformInsights(videos);
    const recommendations = await this.generateRecommendations(
      userId,
      videos,
      topPerformers,
      platformInsights
    );

    return {
      totalVideos: videos.length,
      totalViews,
      avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
      topPerformers,
      underperformers,
      recommendations,
      bestPostingDay: bestDay,
      bestPostingHour: bestHour,
      platformInsights,
    };
  }

  private calcBestPostingTime(videos: IPlatformContent[]) {
    const dayEngagement: Record<number, number> = {};
    const hourEngagement: Record<number, number> = {};
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (const v of videos) {
      const d = new Date(v.publishedAt);
      const day = d.getDay();
      const hour = d.getHours();
      const eng = v.likes + v.comments + v.shares;
      dayEngagement[day] = (dayEngagement[day] ?? 0) + eng;
      hourEngagement[hour] = (hourEngagement[hour] ?? 0) + eng;
    }

    const bestDayNum = Object.entries(dayEngagement).sort(([, a], [, b]) => b - a)[0]?.[0];
    const bestHour = Object.entries(hourEngagement).sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      bestDay: days[parseInt(bestDayNum ?? "5", 10)],
      bestHour: parseInt(bestHour ?? "19", 10),
    };
  }

  private calcPlatformInsights(videos: IPlatformContent[]) {
    const insights: AccountContentAnalysis["platformInsights"] = {};

    for (const v of videos) {
      if (!insights[v.platform]) {
        insights[v.platform] = { avgViews: 0, avgEngagement: 0, videoCount: 0 };
      }
      insights[v.platform].avgViews += v.views;
      insights[v.platform].avgEngagement += v.engagementRate ?? 0;
      insights[v.platform].videoCount += 1;
    }

    for (const platform of Object.keys(insights)) {
      const p = insights[platform];
      p.avgViews = Math.round(p.avgViews / p.videoCount);
      p.avgEngagement = parseFloat((p.avgEngagement / p.videoCount).toFixed(2));
    }

    return insights;
  }

  private async generateRecommendations(
    userId: string,
    videos: IPlatformContent[],
    topPerformers: AccountContentAnalysis["topPerformers"],
    platformInsights: AccountContentAnalysis["platformInsights"]
  ): Promise<ViralRecommendation[]> {
    const ruleBased = this.getRuleBasedRecommendations(videos, topPerformers, platformInsights);

    try {
      const aiRecs = await aiService.generateViralRecommendations(
        userId,
        videos.map((v) => ({
          title: v.title,
          platform: v.platform,
          views: v.views,
          likes: v.likes,
          viralScore: v.viralScore,
          hashtags: v.hashtags,
          duration: v.duration,
        })),
        topPerformers
      );
      return [...ruleBased, ...aiRecs].slice(0, 8);
    } catch {
      return ruleBased;
    }
  }

  private getRuleBasedRecommendations(
    videos: IPlatformContent[],
    topPerformers: AccountContentAnalysis["topPerformers"],
    platformInsights: AccountContentAnalysis["platformInsights"]
  ): ViralRecommendation[] {
    const recs: ViralRecommendation[] = [];

    if (topPerformers.length > 0) {
      const top = topPerformers[0];
      recs.push({
        type: "content",
        priority: "high",
        title: "Double down on what works",
        description: `Your best video "${top.title}" scored ${top.viralScore}/100. Create similar content with the same format and energy.`,
        impact: "+25-40% engagement potential",
      });
    }

    const bestPlatform = Object.entries(platformInsights).sort(
      ([, a], [, b]) => b.avgEngagement - a.avgEngagement
    )[0];

    if (bestPlatform) {
      recs.push({
        type: "platform",
        priority: "high",
        title: `Focus on ${bestPlatform[0]}`,
        description: `${bestPlatform[0]} has your highest engagement (${bestPlatform[1].avgEngagement}%). Prioritize posting there first.`,
        impact: "+15-30% reach",
      });
    }

    const avgDuration =
      videos.filter((v) => v.duration).reduce((s, v) => s + (v.duration ?? 0), 0) /
      (videos.filter((v) => v.duration).length || 1);

    if (avgDuration > 45) {
      recs.push({
        type: "format",
        priority: "medium",
        title: "Shorten your videos",
        description: `Your average duration is ${Math.round(avgDuration)}s. Top creators in Tunisia use 15-35s clips.`,
        impact: "+20% completion rate",
      });
    }

    recs.push({
      type: "timing",
      priority: "medium",
      title: "Post between 7-9 PM",
      description: "Tunisia peak hours are Friday-Sunday evenings. Schedule your next 3 posts in this window.",
      impact: "+18% initial views",
    });

    recs.push({
      type: "hashtags",
      priority: "medium",
      title: "Use Tunisia-local hashtags",
      description: "Mix 3 broad tags (#Tunisia, #Reels) with 5 niche tags (#TunisFood, #Djerba) for better discovery.",
      impact: "+12% discoverability",
    });

    const lowEngagement = videos.filter((v) => (v.viralScore ?? 0) < 50).length;
    if (lowEngagement > videos.length * 0.5) {
      recs.push({
        type: "content",
        priority: "high",
        title: "Improve your hook",
        description: "Over half your videos underperform. Start with a question or bold statement in the first 2 seconds.",
        impact: "+35% watch time",
      });
    }

    return recs;
  }

  private getDefaultRecommendations(): ViralRecommendation[] {
    return [
      {
        type: "platform",
        priority: "high",
        title: "Connect your accounts",
        description: "Link TikTok, Instagram, or YouTube in Settings to sync your reels and get personalized tips.",
        impact: "Unlock full analysis",
      },
      {
        type: "timing",
        priority: "medium",
        title: "Post at peak hours",
        description: "Tunisia audience is most active Friday-Sunday, 7-9 PM.",
        impact: "+18% views",
      },
    ];
  }
}

export const contentAnalysisService = new ContentAnalysisService();
