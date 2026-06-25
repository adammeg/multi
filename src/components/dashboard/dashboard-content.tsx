"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  FileVideo,
  Heart,
  Link2,
  PlusCircle,
  RefreshCw,
  Settings,
  Clapperboard,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatforms } from "@/hooks/use-platforms";

async function fetchDashboardStats(token: string | null) {
  const res = await fetch("/api/analytics", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data;
}

async function syncContent(token: string | null) {
  const res = await fetch("/api/content", {
    method: "POST",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Sync failed");
  return json.data;
}

export function DashboardContent() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: platformsData } = usePlatforms();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchDashboardStats(accessToken),
  });

  const syncMutation = useMutation({
    mutationFn: () => syncContent(accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["my-reels"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-views"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-engagement"] });
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
    },
  });

  const connectedPlatforms = platformsData?.platforms.filter((p) => p.connected) ?? [];
  const connectedCount = platformsData?.connectedCount ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data ?? {
    totalViews: 0,
    totalPosts: 0,
    syncedVideos: 0,
    engagementRate: 0,
    connectedPlatforms: 0,
    platformBreakdown: [],
    dataSource: "none",
  };

  const hasSyncedData = (stats.syncedVideos ?? 0) > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            Real stats from your connected accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={syncMutation.isPending || connectedCount === 0}
            onClick={() => syncMutation.mutate()}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`}
            />
            {syncMutation.isPending ? "Syncing..." : "Sync accounts"}
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/new-post">
              <PlusCircle className="mr-2 h-4 w-4" />
              New post
            </Link>
          </Button>
        </div>
      </div>

      {syncMutation.isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {syncMutation.data?.message}
        </div>
      )}
      {syncMutation.isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {syncMutation.error instanceof Error ? syncMutation.error.message : "Sync failed"}
        </div>
      )}

      {connectedCount === 0 ? (
        <Card className="border-violet-200 bg-violet-50/40">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <Link2 className="h-10 w-10 text-violet-600" />
            <div>
              <p className="font-medium text-slate-900">Connect a platform to get started</p>
              <p className="mt-1 text-sm text-slate-600">
                Link TikTok, YouTube, Instagram, or Facebook to sync your real videos and stats.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                Go to Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connected accounts</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {connectedPlatforms.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                {p.account?.profilePicture ? (
                  <img
                    src={p.account.profilePicture}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                    {p.name[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium capitalize">{p.id}</p>
                  <p className="truncate text-xs text-slate-500">@{p.account?.platformUsername}</p>
                </div>
                <Badge variant="success" className="ml-1 shrink-0">
                  Live
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} />
        <StatCard
          title="Synced Videos"
          value={stats.syncedVideos ?? 0}
          icon={Clapperboard}
          description={hasSyncedData ? "From your accounts" : "Tap Sync accounts"}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          icon={Heart}
        />
        <StatCard
          title="Posts via App"
          value={stats.totalPosts}
          icon={FileVideo}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.platformBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.platformBreakdown.map(
                (p: {
                  _id: string;
                  totalViews: number;
                  totalEngagement: number;
                  videoCount?: number;
                }) => (
                  <div
                    key={p._id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {p._id}
                      </Badge>
                      {p.videoCount != null && (
                        <span className="text-xs text-slate-500">{p.videoCount} videos</span>
                      )}
                    </div>
                    <span className="text-sm text-slate-600">
                      {p.totalViews.toLocaleString()} views ·{" "}
                      {p.totalEngagement.toLocaleString()} engagement
                    </span>
                  </div>
                )
              )}
            </div>
          ) : connectedCount > 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-600">
                Accounts connected — tap <strong>Sync accounts</strong> to pull your real videos
                and stats.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                size="sm"
                disabled={syncMutation.isPending}
                onClick={() => syncMutation.mutate()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync now
              </Button>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Connect platforms in Settings to see performance data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
