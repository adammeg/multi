"use client";

import { useQuery } from "@tanstack/react-query";

export type UploadConfig = {
  blobConfigured: boolean;
  maxDirectUploadBytes: number;
  message: string;
};

async function fetchUploadConfig(): Promise<UploadConfig> {
  const res = await fetch("/api/posts/upload");
  const json = await res.json();
  return {
    blobConfigured: json.blobConfigured ?? false,
    maxDirectUploadBytes: json.maxDirectUploadBytes ?? 4 * 1024 * 1024,
    message: json.message ?? "",
  };
}

export function useUploadConfig() {
  return useQuery({
    queryKey: ["upload-config"],
    queryFn: fetchUploadConfig,
    staleTime: 60_000,
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
