import axios from "axios";
import { decrypt } from "@/lib/crypto/encryption";
import { oauthTokenRepository } from "@/features/platforms/repositories/connected-account.repository";
import type { IConnectedAccount } from "@/lib/db/models";
import type { Platform, PlatformVideoItem } from "@/types";

export class PlatformContentFetcher {
  async fetchVideos(
    account: IConnectedAccount,
    accessToken: string
  ): Promise<PlatformVideoItem[]> {
    switch (account.platform) {
      case "tiktok":
        return this.fetchTikTokVideos(accessToken);
      case "instagram":
        return this.fetchInstagramReels(accessToken, account);
      case "facebook":
        return this.fetchFacebookReels(accessToken, account);
      case "youtube":
        return this.fetchYouTubeShorts(accessToken);
      default:
        return [];
    }
  }

  private async getToken(accountId: string): Promise<string | null> {
    const tokenDoc = await oauthTokenRepository.findByAccountId(accountId);
    if (!tokenDoc) return null;
    return decrypt(tokenDoc.accessTokenEncrypted);
  }

  async fetchWithAccount(
    account: IConnectedAccount
  ): Promise<{ videos: PlatformVideoItem[]; error?: string }> {
    const token = await this.getToken(account._id.toString());
    if (!token) {
      return { videos: [], error: "No access token — reconnect this platform in Settings." };
    }

    try {
      const videos = await this.fetchVideos(account, token);
      return { videos };
    } catch (err) {
      const message = err instanceof Error ? err.message : "API request failed";
      return {
        videos: [],
        error: `${account.platform}: ${message}`,
      };
    }
  }

  private async fetchTikTokVideos(accessToken: string): Promise<PlatformVideoItem[]> {
    const res = await axios.post(
      "https://open.tiktokapis.com/v2/video/list/",
      { max_count: 20 },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        params: {
          fields:
            "id,title,cover_image_url,share_url,duration,create_time,view_count,like_count,comment_count,share_count",
        },
      }
    );

    const apiError = res.data?.error;
    if (apiError && apiError.code && apiError.code !== "ok") {
      throw new Error(apiError.message ?? apiError.code);
    }

    const videos = res.data?.data?.videos ?? [];
    return videos.map((v: Record<string, unknown>) => ({
      externalId: String(v.id),
      title: String(v.title ?? ""),
      caption: String(v.title ?? ""),
      thumbnailUrl: String(v.cover_image_url ?? ""),
      permalink: String(v.share_url ?? ""),
      duration: Number(v.duration ?? 0),
      publishedAt: new Date(Number(v.create_time ?? 0) * 1000),
      views: Number(v.view_count ?? 0),
      likes: Number(v.like_count ?? 0),
      comments: Number(v.comment_count ?? 0),
      shares: Number(v.share_count ?? 0),
      saves: 0,
      hashtags: this.extractHashtags(String(v.title ?? "")),
    }));
  }

  private async fetchInstagramReels(
    accessToken: string,
    account: IConnectedAccount
  ): Promise<PlatformVideoItem[]> {
    const igUserId = (account.metadata?.igUserId as string) ?? account.platformUserId;
    const res = await axios.get(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      params: {
        fields:
          "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count",
        access_token: accessToken,
        limit: 20,
      },
    });

    const items = (res.data?.data ?? []).filter(
      (m: { media_type: string }) => m.media_type === "VIDEO" || m.media_type === "REELS"
    );

    return items.map((m: Record<string, unknown>) => ({
      externalId: String(m.id),
      title: String(m.caption ?? "").slice(0, 80),
      caption: String(m.caption ?? ""),
      thumbnailUrl: String(m.thumbnail_url ?? m.media_url ?? ""),
      permalink: String(m.permalink ?? ""),
      publishedAt: new Date(String(m.timestamp)),
      views: 0,
      likes: Number(m.like_count ?? 0),
      comments: Number(m.comments_count ?? 0),
      shares: 0,
      saves: 0,
      hashtags: this.extractHashtags(String(m.caption ?? "")),
    }));
  }

  private async fetchFacebookReels(
    accessToken: string,
    account: IConnectedAccount
  ): Promise<PlatformVideoItem[]> {
    const pageId = (account.metadata?.pageId as string) ?? account.platformUserId;
    const res = await axios.get(`https://graph.facebook.com/v18.0/${pageId}/video_reels`, {
      params: {
        fields:
          "id,description,created_time,permalink_url,picture,views,likes.summary(true),comments.summary(true)",
        access_token: accessToken,
        limit: 20,
      },
    });

    return (res.data?.data ?? []).map((v: Record<string, unknown>) => ({
      externalId: String(v.id),
      title: String(v.description ?? "").slice(0, 80),
      caption: String(v.description ?? ""),
      thumbnailUrl: String((v.picture as string) ?? ""),
      permalink: String(v.permalink_url ?? ""),
      publishedAt: new Date(String(v.created_time)),
      views: Number(v.views ?? 0),
      likes: Number((v.likes as { summary?: { total_count?: number } })?.summary?.total_count ?? 0),
      comments: Number(
        (v.comments as { summary?: { total_count?: number } })?.summary?.total_count ?? 0
      ),
      shares: 0,
      saves: 0,
      hashtags: this.extractHashtags(String(v.description ?? "")),
    }));
  }

  private async fetchYouTubeShorts(accessToken: string): Promise<PlatformVideoItem[]> {
    const searchRes = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        forMine: true,
        type: "video",
        videoDuration: "short",
        maxResults: 20,
        order: "date",
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const videoIds = (searchRes.data?.items ?? [])
      .map((i: { id: { videoId: string } }) => i.id.videoId)
      .filter(Boolean);

    if (videoIds.length === 0) return [];

    const statsRes = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "snippet,statistics,contentDetails",
        id: videoIds.join(","),
      },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return (statsRes.data?.items ?? []).map((v: Record<string, unknown>) => {
      const snippet = v.snippet as {
        title?: string;
        description?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string } };
      };
      const stats = v.statistics as Record<string, string>;
      const details = v.contentDetails as { duration?: string };
      return {
        externalId: String(v.id),
        title: snippet?.title ?? "",
        caption: snippet?.description ?? "",
        thumbnailUrl: snippet?.thumbnails?.medium?.url ?? "",
        permalink: `https://youtube.com/shorts/${v.id}`,
        duration: this.parseIsoDuration(details?.duration ?? "PT0S"),
        publishedAt: new Date(snippet?.publishedAt ?? Date.now()),
        views: parseInt(stats?.viewCount ?? "0", 10),
        likes: parseInt(stats?.likeCount ?? "0", 10),
        comments: parseInt(stats?.commentCount ?? "0", 10),
        shares: 0,
        saves: 0,
        hashtags: this.extractHashtags(snippet?.description ?? ""),
      };
    });
  }

  private extractHashtags(text: string): string[] {
    return text.match(/#[\w\u0600-\u06FF]+/g) ?? [];
  }

  private parseIsoDuration(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (
      parseInt(match[1] ?? "0", 10) * 3600 +
      parseInt(match[2] ?? "0", 10) * 60 +
      parseInt(match[3] ?? "0", 10)
    );
  }
}

export const platformContentFetcher = new PlatformContentFetcher();
