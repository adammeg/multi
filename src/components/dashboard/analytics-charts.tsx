"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Eye, Heart, Clapperboard, RefreshCw, TrendingUp, ExternalLink } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatforms } from "@/hooks/use-platforms";
import type { Platform } from "@/types";

type DashboardStats = {
  totalViews: number;
  syncedVideos: number;
  engagementRate: number;
  connectedPlatforms: number;
  dataSource: string;
  platformBreakdown: {
    _id: string;
    totalViews: number;
    totalEngagement: number;
    videoCount?: number;
  }[];
  topVideos: {
    title: string;
    platform: Platform;
    views: number;
    likes: number;
    comments: number;
    engagementRate?: number;
    thumbnailUrl?: string;
    permalink?: string;
    publishedAt: string;
  }[];
};

async function fetchAnalytics<T>(type: string, token: string | null): Promise<T> {
  const res = await fetch(`/api/analytics?type=${type}`, {
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load analytics");
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

function formatChartDate(date: string) {
  if (date.length === 7) {
    const [year, month] = date.split("-");
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatTooltipNumber(value: unknown): string {
  const n = typeof value === "number" ? value : Number(value ?? 0);
  return Number.isFinite(n) ? n.toLocaleString() : String(value ?? "");
}

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center text-center px-4">
      <p className="text-sm text-slate-500">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href="/dashboard/my-reels">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync from My Reels
        </Link>
      </Button>
    </div>
  );
}

export function AnalyticsCharts() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const { data: platformsData } = usePlatforms();
  const connectedCount = platformsData?.connectedCount ?? 0;

  const invalidateAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: ["analytics-views"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-engagement"] });
    queryClient.invalidateQueries({ queryKey: ["analytics-dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };

  const syncMutation = useMutation({
    mutationFn: () => syncContent(accessToken),
    onSuccess: invalidateAnalytics,
  });

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    isError: dashboardError,
  } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => fetchAnalytics<DashboardStats>("dashboard", accessToken),
  });

  const { data: viewsData = [], isLoading: viewsLoading } = useQuery({
    queryKey: ["analytics-views"],
    queryFn: () => fetchAnalytics<{ date: string; views: number }[]>("views", accessToken),
  });

  const { data: engagementData = [], isLoading: engagementLoading } = useQuery({
    queryKey: ["analytics-engagement"],
    queryFn: () => fetchAnalytics<{ date: string; engagement: number }[]>("engagement", accessToken),
  });

  const chartViews = viewsData.map((d) => ({ ...d, label: formatChartDate(d.date) }));
  const chartEngagement = engagementData.map((d) => ({ ...d, label: formatChartDate(d.date) }));

  const platformData =
    dashboard?.platformBreakdown?.map((p) => ({
      platform: p._id.charAt(0).toUpperCase() + p._id.slice(1),
      views: p.totalViews,
      engagement: p.totalEngagement,
      videoCount: p.videoCount,
    })) ?? [];

  const hasSyncedData = (dashboard?.syncedVideos ?? 0) > 0;
  const hasViews = chartViews.length > 0;
  const hasEngagement = chartEngagement.length > 0;
  const hasPlatformData = platformData.length > 0;
  const chartsLoading = viewsLoading || engagementLoading || dashboardLoading;

  if (dashboardLoading && !dashboard) {
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

  const stats = dashboard ?? {
    totalViews: 0,
    syncedVideos: 0,
    engagementRate: 0,
    connectedPlatforms: 0,
    dataSource: "none",
    platformBreakdown: [],
    topVideos: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Analytics</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            Real performance from your synced accounts
            {hasSyncedData && stats.dataSource === "synced_accounts" && (
              <span className="text-emerald-600"> · live data</span>
            )}
            .
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={syncMutation.isPending || connectedCount === 0}
          onClick={() => syncMutation.mutate()}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Refresh data"}
        </Button>
      </div>

      {dashboardError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load analytics. Try signing in again.
        </div>
      )}

      {syncMutation.isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {(syncMutation.data as { message?: string })?.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={Eye}
          description={hasSyncedData ? "Across synced videos" : "Sync to populate"}
        />
        <StatCard
          title="Synced Videos"
          value={stats.syncedVideos}
          icon={Clapperboard}
        />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          icon={Heart}
        />
        <StatCard
          title="Connected"
          value={stats.connectedPlatforms}
          icon={TrendingUp}
          description="Active platforms"
        />
      </div>

      {!hasSyncedData && connectedCount > 0 && (
        <Card className="border-violet-200 bg-violet-50/40">
          <CardContent className="py-8 text-center">
            <p className="text-slate-700">
              Accounts connected — sync to pull your real views and engagement.
            </p>
            <Button
              className="mt-4"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync now
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Views by publish date</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {chartsLoading ? (
              <div className="h-[240px] animate-pulse rounded bg-slate-100" />
            ) : hasViews ? (
              <div className="min-w-[280px]">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartViews}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => [formatTooltipNumber(value), "Views"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date
                          ? formatChartDate(String(payload[0].payload.date))
                          : ""
                      }
                    />
                    <Line type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No view data yet. Sync your accounts to see performance by publish date." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement by publish date</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {chartsLoading ? (
              <div className="h-[240px] animate-pulse rounded bg-slate-100" />
            ) : hasEngagement ? (
              <div className="min-w-[280px]">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartEngagement}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [formatTooltipNumber(value), "Engagement"]} />
                    <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No engagement data yet. Sync your accounts to populate charts." />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Platform comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {chartsLoading ? (
              <div className="h-[260px] animate-pulse rounded bg-slate-100" />
            ) : hasPlatformData ? (
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => formatTooltipNumber(value)} />
                    <Legend />
                    <Bar dataKey="views" name="Views" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="Connect and sync platforms to compare performance." />
            )}
          </CardContent>
        </Card>
      </div>

      {hasPlatformData && (
        <Card>
          <CardHeader>
            <CardTitle>Platform breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {platformData.map((p) => (
              <div
                key={p.platform}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{p.platform}</Badge>
                  {p.videoCount != null && (
                    <span className="text-xs text-slate-500">{p.videoCount} videos</span>
                  )}
                </div>
                <span className="text-sm text-slate-600">
                  {p.views.toLocaleString()} views · {p.engagement.toLocaleString()} engagement
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {stats.topVideos?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top performing videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topVideos.map((video, i) => (
              <div
                key={`${video.platform}-${video.title}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {i + 1}
                </span>
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-14 w-10 shrink-0 rounded object-cover bg-slate-100"
                  />
                ) : (
                  <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">
                    ▶
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{video.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <Badge variant="outline" className="capitalize text-xs">
                      {video.platform}
                    </Badge>
                    <span>{video.views.toLocaleString()} views</span>
                    <span>{video.likes.toLocaleString()} likes</span>
                    {video.engagementRate != null && (
                      <span>{video.engagementRate}% engagement</span>
                    )}
                  </div>
                </div>
                {video.permalink && video.permalink !== "#" && (
                  <a href={video.permalink} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
