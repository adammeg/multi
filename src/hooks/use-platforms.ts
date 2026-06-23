"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import type { Platform } from "@/types";

export type PlatformInfo = {
  id: Platform;
  name: string;
  description: string;
  connected: boolean;
  account: {
    platformUsername: string;
    profilePicture?: string;
    connectedAt?: string;
  } | null;
};

export type PlatformsData = {
  platforms: PlatformInfo[];
  connectedCount: number;
  totalCount: number;
};

async function fetchPlatforms(token: string | null): Promise<PlatformsData> {
  const res = await fetch("/api/platforms", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!json.success) {
    return { platforms: [], connectedCount: 0, totalCount: 4 };
  }
  return json.data ?? { platforms: [], connectedCount: 0, totalCount: 4 };
}

export function usePlatforms() {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ["platforms"],
    queryFn: () => fetchPlatforms(accessToken),
  });
}
