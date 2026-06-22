import { getEnv } from "@/lib/config/env";
import type { Platform } from "@/types";

/** Public base URL used for OAuth redirects (set NEXT_PUBLIC_APP_URL in Vercel env). */
export function getAppBaseUrl(): string {
  const { NEXT_PUBLIC_APP_URL } = getEnv();
  return NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

export function getOAuthRedirectUri(platform: Platform): string {
  const env = getEnv();

  const explicit: Partial<Record<Platform, string | undefined>> = {
    tiktok: env.TIKTOK_REDIRECT_URI,
    instagram: env.META_REDIRECT_URI,
    facebook: env.META_REDIRECT_URI,
    youtube: env.GOOGLE_REDIRECT_URI,
  };

  const override = explicit[platform];
  if (override) return override;

  return `${getAppBaseUrl()}/api/oauth/${platform}/callback`;
}
