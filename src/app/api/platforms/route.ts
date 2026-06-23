import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { connectedAccountRepository } from "@/features/platforms/repositories/connected-account.repository";
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
    const connected = await connectedAccountRepository.findByUserId(user.userId);

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
            }
          : null,
      };
    });

    return successResponse({
      platforms,
      connectedCount: connected.length,
      totalCount: PLATFORMS.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
