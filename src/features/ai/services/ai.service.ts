import axios from "axios";
import { getEnv } from "@/lib/config/env";
import { AppError } from "@/lib/utils/api-response";
import type { Platform, Language } from "@/types";
import type {
  CaptionGeneratorDto,
  HashtagGeneratorDto,
  ViralScoreDto,
} from "@/features/ai/dto/ai.dto";

export class AIService {
  private async callMistral(prompt: string): Promise<string> {
    const { MISTRAL_API_KEY, MISTRAL_MODEL, LLAMA_API_URL, LLAMA_MODEL } = getEnv();

    if (MISTRAL_API_KEY) {
      const response = await axios.post(
        "https://api.mistral.ai/v1/chat/completions",
        {
          model: MISTRAL_MODEL,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        },
        {
          headers: {
            Authorization: `Bearer ${MISTRAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.choices[0].message.content;
    }

    if (LLAMA_API_URL) {
      const response = await axios.post(`${LLAMA_API_URL}/api/generate`, {
        model: LLAMA_MODEL,
        prompt,
        stream: false,
      });
      return response.data.response;
    }

    throw new AppError("No AI provider configured", 503);
  }

  async generateCaptions(dto: CaptionGeneratorDto) {
    const langMap: Record<Language, string> = {
      fr: "French",
      ar: "Arabic",
      en: "English",
    };

    const results: Record<string, string[]> = {};

    for (const platform of dto.platforms) {
      const prompt = `Generate 3 unique ${langMap[dto.language]} captions for ${platform} about: "${dto.topic}".
Target audience: Tunisian content creators.
Return ONLY a JSON array of 3 strings, no other text.`;
      const raw = await this.callMistral(prompt);
      try {
        results[platform] = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
      } catch {
        results[platform] = raw.split("\n").filter(Boolean).slice(0, 3);
      }
    }

    return results;
  }

  async generateHashtags(dto: HashtagGeneratorDto) {
    const prompt = `Generate ${dto.count} trending hashtags for ${dto.category} content in ${dto.country}, language: ${dto.language}.
Focus on Tunisia and North Africa trends.
Return ONLY a JSON array of hashtag strings with # prefix.`;
    const raw = await this.callMistral(prompt);
    try {
      return JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
    } catch {
      return raw.match(/#\w+/g)?.slice(0, dto.count) ?? [];
    }
  }

  async getBestPostingTime(userId: string) {
    const { analyticsRepository } = await import(
      "@/features/analytics/repositories/analytics.repository"
    );
    const data = await analyticsRepository.findByUserId(userId, 90);

    if (data.length === 0) {
      return {
        bestDay: "Friday",
        bestHour: 19,
        confidence: "low",
        note: "Insufficient data. Default based on Tunisia peak hours.",
      };
    }

    const hourEngagement: Record<number, number> = {};
    const dayEngagement: Record<number, number> = {};

    for (const record of data) {
      const hour = new Date(record.recordedAt).getHours();
      const day = new Date(record.recordedAt).getDay();
      const engagement = record.likes + record.comments + record.shares;
      hourEngagement[hour] = (hourEngagement[hour] ?? 0) + engagement;
      dayEngagement[day] = (dayEngagement[day] ?? 0) + engagement;
    }

    const bestHour = Object.entries(hourEngagement).sort(([, a], [, b]) => b - a)[0]?.[0];
    const bestDayNum = Object.entries(dayEngagement).sort(([, a], [, b]) => b - a)[0]?.[0];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return {
      bestDay: days[parseInt(bestDayNum ?? "5", 10)],
      bestHour: parseInt(bestHour ?? "19", 10),
      confidence: data.length > 20 ? "high" : "medium",
    };
  }

  async qualityCheck(params: {
    duration: number;
    captionLength: number;
    hashtags: string[];
    aspectRatio: string;
  }) {
    const recommendations: string[] = [];
    let score = 100;

    if (params.duration > 60) {
      score -= 30;
      recommendations.push("Trim video to under 60 seconds");
    } else if (params.duration < 15) {
      score -= 10;
      recommendations.push("Videos 15-45s tend to perform best");
    }

    if (params.captionLength > 150) {
      score -= 10;
      recommendations.push("Shorten caption for TikTok (under 150 chars ideal)");
    }

    if (params.hashtags.length < 3) {
      score -= 15;
      recommendations.push("Add at least 3-5 relevant hashtags");
    } else if (params.hashtags.length > 15) {
      score -= 10;
      recommendations.push("Reduce hashtags to 5-10 for better reach");
    }

    return { score: Math.max(0, score), recommendations, passed: score >= 70 };
  }

  async calculateViralScore(dto: ViralScoreDto, historicalEngagement = 0) {
    let score = 50;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    if (dto.duration >= 15 && dto.duration <= 45) {
      score += 15;
      strengths.push("Optimal video duration (15-45s)");
    } else {
      weaknesses.push("Duration outside optimal range");
      recommendations.push("Aim for 15-45 second videos");
    }

    if (dto.hashtags.length >= 5 && dto.hashtags.length <= 10) {
      score += 10;
      strengths.push("Good hashtag count");
    } else {
      weaknesses.push("Hashtag count not optimal");
    }

    if (dto.postingHour >= 18 && dto.postingHour <= 22) {
      score += 10;
      strengths.push("Posting during peak Tunisia hours");
    } else {
      recommendations.push("Post between 6-10 PM for best reach in Tunisia");
    }

    if (historicalEngagement > 1000) {
      score += 15;
      strengths.push("Strong historical engagement");
    }

    score = Math.min(100, Math.max(0, score));

    return { score, strengths, weaknesses, recommendations };
  }

  async analyzeUserBehavior(userId: string) {
    const { analyticsRepository } = await import(
      "@/features/analytics/repositories/analytics.repository"
    );
    const data = await analyticsRepository.findByUserId(userId, 90);

    const insights: string[] = [];
    if (data.length === 0) {
      return {
        insights: ["Publish more content to unlock behavior insights"],
        bestContentType: "unknown",
        bestPostingDay: "Friday",
        bestPostingTime: "19:00",
      };
    }

    const platformPerf = await analyticsRepository.aggregateByPlatform(userId);
    const best = platformPerf.sort((a, b) => b.totalEngagement - a.totalEngagement)[0];
    if (best) {
      insights.push(`${best._id} is your top performing platform`);
    }

    insights.push("Videos with faces perform +35% better on average");
    insights.push("Content posted on Friday evenings sees highest engagement in Tunisia");

    return {
      insights,
      bestContentType: "short-form video",
      bestPostingDay: "Friday",
      bestPostingTime: "19:00",
    };
  }

  async generateViralRecommendations(
    userId: string,
    videos: { title: string; platform: string; views: number; likes: number; viralScore?: number; hashtags: string[]; duration?: number }[],
    topPerformers: { title: string; platform: string; viralScore: number }[]
  ) {
    const summary = videos.slice(0, 10).map((v) => ({
      title: v.title,
      platform: v.platform,
      views: v.views,
      score: v.viralScore,
      hashtags: v.hashtags.slice(0, 5),
      duration: v.duration,
    }));

    const prompt = `You are a viral content strategist for Tunisian creators on TikTok, Instagram, Facebook, and YouTube Shorts.

Analyze this creator's content library and top performers:
${JSON.stringify({ topPerformers, recentVideos: summary }, null, 2)}

Return 3-4 personalized recommendations to increase virality. Focus on Tunisia audience (French/Arabic content, local trends, peak hours 7-9 PM).

Return ONLY a JSON array of objects with this shape:
[{"type":"timing|content|hashtags|format|platform","priority":"high|medium|low","title":"...","description":"...","impact":"+X% metric"}]`;

    try {
      const raw = await this.callMistral(prompt);
      const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, ""));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through
    }
    return [];
  }
}

export const aiService = new AIService();
