export type Platform = "tiktok" | "instagram" | "facebook" | "youtube";

export type PostStatus =
  | "PENDING"
  | "PROCESSING"
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL_SUCCESS";

export type SubscriptionPlan = "FREE" | "PRO" | "AGENCY";

export type UserRole = "user" | "admin";

export type Language = "fr" | "ar" | "en";

export type TrendCategory =
  | "entertainment"
  | "food"
  | "fashion"
  | "tech"
  | "travel"
  | "sports"
  | "education"
  | "other";

export interface PlatformPublishResult {
  platform: Platform;
  status: "SUCCESS" | "FAILED";
  externalId?: string;
  url?: string;
  error?: string;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  fileSize: number;
  format: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface PlatformVideoItem {
  externalId: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  permalink?: string;
  duration?: number;
  publishedAt: Date;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  hashtags?: string[];
}

export interface ViralRecommendation {
  type: "timing" | "content" | "hashtags" | "format" | "platform";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact: string;
}

export interface AccountContentAnalysis {
  totalVideos: number;
  totalViews: number;
  avgEngagementRate: number;
  topPerformers: { title: string; platform: Platform; viralScore: number; views: number }[];
  underperformers: { title: string; platform: Platform; viralScore: number; recommendations: string[] }[];
  recommendations: ViralRecommendation[];
  bestPostingDay: string;
  bestPostingHour: number;
  platformInsights: Record<string, { avgViews: number; avgEngagement: number; videoCount: number }>;
}
