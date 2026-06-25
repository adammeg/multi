import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { connectedAccountRepository } from "@/features/platforms/repositories/connected-account.repository";
import { subscriptionRepository } from "@/features/subscription/repositories/subscription.repository";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";
import type { Platform } from "@/types";

const PLATFORMS: { id: Platform; name: string; description: string }[] = [
  { id: "tiktok", name: "TikTok", description: "Publish short-form videos" },
  { id: "instagram", name: "Instagram Reels", description: "Business & Creator accounts" },
  { id: "facebook", name: "Facebook Reels", description: "Facebook Pages" },
  { id: "youtube", name: "YouTube Shorts", description: "Vertical short videos" },
];

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const [connected, sub] = await Promise.all([
      connectedAccountRepository.findByUserId(user.userId),
      subscriptionRepository.findByUserId(user.userId),
    ]);

    const platforms = PLATFORMS.map((p) => {
      const account = connected.find((c) => c.platform === p.id);
      return {
        ...p,
        connected: !!account,
        account: account
          ? {
              platformUsername: account.platformUsername,
              profilePicture: account.profilePicture,
              connectedAt: account.createdAt,
              lastSyncedAt: account.lastSyncedAt,
            }
          : null,
      };
    });

    return successResponse({
      platforms,
      connectedCount: connected.length,
      totalCount: PLATFORMS.length,
      plan: sub?.plan ?? "FREE",
      connectedAccountsLimit: sub?.connectedAccountsLimit ?? 1,
      postsLimit: sub?.postsLimit ?? 10,
      postsUsedThisMonth: sub?.postsUsedThisMonth ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
