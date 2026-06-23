import axios from "axios";
import { getEnv } from "@/lib/config/env";
import { getOAuthRedirectUri } from "@/lib/config/oauth-urls";
import { encrypt } from "@/lib/crypto/encryption";
import {
  connectedAccountRepository,
  oauthTokenRepository,
} from "@/features/platforms/repositories/connected-account.repository";
import { checkConnectedAccountLimit } from "@/lib/middleware/subscription.middleware";
import type { Platform } from "@/types";

export class OAuthService {
  getAuthUrl(platform: Platform, userId: string): string {
    const state = Buffer.from(JSON.stringify({ userId, platform })).toString("base64url");
    const env = getEnv();

    switch (platform) {
      case "tiktok":
        return `https://www.tiktok.com/v2/auth/authorize/?client_key=${env.TIKTOK_CLIENT_KEY}&scope=user.info.basic,video.list,video.publish&response_type=code&redirect_uri=${encodeURIComponent(getOAuthRedirectUri("tiktok"))}&state=${state}`;
      case "instagram":
      case "facebook":
        return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${env.META_APP_ID}&redirect_uri=${encodeURIComponent(getOAuthRedirectUri(platform))}&scope=instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement&state=${state}`;
      case "youtube":
        return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(getOAuthRedirectUri("youtube"))}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload%20https://www.googleapis.com/auth/youtube.readonly&state=${state}&access_type=offline&prompt=consent`;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async handleCallback(platform: Platform, code: string, state: string) {
    const { userId } = JSON.parse(Buffer.from(state, "base64url").toString()) as {
      userId: string;
      platform: Platform;
    };

    await checkConnectedAccountLimit(userId, platform);

    const tokens = await this.exchangeCode(platform, code);
    const profile = await this.fetchProfile(platform, tokens.access_token);

    let account = await connectedAccountRepository.findByPlatformUserId(
      platform,
      profile.id
    );

    if (account) {
      if (account.userId.toString() !== userId) {
        throw new Error("This social account is already linked to another user");
      }
      const updated = await connectedAccountRepository.update(account._id.toString(), {
        platformUsername: profile.username,
        profilePicture: profile.picture,
        accountType: profile.type,
        isActive: true,
        lastSyncedAt: new Date(),
      });
      if (!updated) throw new Error("Failed to update connected account");
      account = updated;
    } else {
      await connectedAccountRepository.deactivateByUserAndPlatform(userId, platform);
      account = await connectedAccountRepository.create({
        userId: userId as unknown as import("mongoose").Types.ObjectId,
        platform,
        platformUserId: profile.id,
        platformUsername: profile.username,
        profilePicture: profile.picture,
        accountType: profile.type,
        isActive: true,
        lastSyncedAt: new Date(),
      });
    }

    await oauthTokenRepository.upsert(account._id.toString(), {
      accessTokenEncrypted: encrypt(tokens.access_token),
      refreshTokenEncrypted: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : undefined,
      expiresAt: new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000),
      scope: tokens.scope,
    });

    return account;
  }

  private async exchangeCode(platform: Platform, code: string) {
    const env = getEnv();

    switch (platform) {
      case "tiktok": {
        if (!env.TIKTOK_CLIENT_KEY || !env.TIKTOK_CLIENT_SECRET) {
          throw new Error("TikTok credentials missing in server environment");
        }
        const redirectUri = getOAuthRedirectUri("tiktok");
        const body = new URLSearchParams({
          client_key: env.TIKTOK_CLIENT_KEY,
          client_secret: env.TIKTOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        });
        const res = await axios.post(
          "https://open.tiktokapis.com/v2/oauth/token/",
          body.toString(),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Cache-Control": "no-cache",
            },
          }
        );
        const data = res.data as {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          scope?: string;
          error?: string;
          error_description?: string;
          message?: string;
        };
        if (!data.access_token) {
          const detail =
            data.error_description ?? data.message ?? data.error ?? "Token exchange failed";
          throw new Error(`TikTok token error: ${detail}`);
        }
        return data;
      }
      case "instagram":
      case "facebook": {
        const redirectUri = getOAuthRedirectUri(platform);
        const res = await axios.get("https://graph.facebook.com/v18.0/oauth/access_token", {
          params: {
            client_id: env.META_APP_ID,
            client_secret: env.META_APP_SECRET,
            redirect_uri: redirectUri,
            code,
          },
        });
        return { ...res.data, refresh_token: undefined };
      }
      case "youtube": {
        const redirectUri = getOAuthRedirectUri("youtube");
        const res = await axios.post("https://oauth2.googleapis.com/token", {
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        });
        return res.data;
      }
    }
  }

  private async fetchProfile(
    platform: Platform,
    accessToken: string
  ): Promise<{ id: string; username: string; picture?: string; type?: string }> {
    switch (platform) {
      case "tiktok": {
        const res = await axios.get("https://open.tiktokapis.com/v2/user/info/", {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { fields: "open_id,display_name,avatar_url" },
        });
        const apiError = res.data?.error;
        if (apiError && apiError.code && apiError.code !== "ok") {
          throw new Error(`TikTok profile error: ${apiError.message ?? apiError.code}`);
        }
        const user = res.data?.data?.user;
        if (!user?.open_id) {
          throw new Error("TikTok profile error: missing user data");
        }
        return {
          id: user.open_id,
          username: user.display_name ?? user.open_id,
          picture: user.avatar_url,
        };
      }
      case "instagram":
      case "facebook": {
        const res = await axios.get("https://graph.facebook.com/v18.0/me", {
          params: { fields: "id,name,picture", access_token: accessToken },
        });
        return { id: res.data.id, username: res.data.name, picture: res.data.picture?.data?.url };
      }
      case "youtube": {
        const res = await axios.get(
          "https://www.googleapis.com/youtube/v3/channels",
          {
            params: { part: "snippet", mine: true },
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const channel = res.data.items?.[0];
        return {
          id: channel?.id ?? "unknown",
          username: channel?.snippet?.title ?? "YouTube Channel",
          picture: channel?.snippet?.thumbnails?.default?.url,
        };
      }
    }
  }

  async refreshExpiringTokens() {
    const expiring = await oauthTokenRepository.findExpiringSoon(30);
    for (const tokenDoc of expiring) {
      if (!tokenDoc.refreshTokenEncrypted) continue;
      const { decrypt } = await import("@/lib/crypto/encryption");
      const refreshToken = decrypt(tokenDoc.refreshTokenEncrypted);
      // Platform-specific refresh logic would go here
      void refreshToken;
    }
  }
}

export const oauthService = new OAuthService();
