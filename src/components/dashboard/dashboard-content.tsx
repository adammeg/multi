"use client";

import { useQuery } from "@tanstack/react-query";
import { Eye, FileVideo, Heart, Link2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";

async function fetchDashboardStats(token: string | null) {
  const res = await fetch("/api/analytics", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data;
}

export function DashboardContent() {
  const { accessToken } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => fetchDashboardStats(accessToken),
  });

  if (isLoading) {
    return <div className="text-slate-500">Loading dashboard...</div>;
  }

  const stats = data ?? {
    totalViews: 0,
    totalPosts: 0,
    engagementRate: 0,
    connectedPlatforms: 0,
    platformBreakdown: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Dashboard</h1>
        <p className="text-sm text-slate-500 sm:text-base">Post once, publish everywhere.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Total Views" value={stats.totalViews.toLocaleString()} icon={Eye} />
        <StatCard title="Total Posts" value={stats.totalPosts} icon={FileVideo} />
        <StatCard
          title="Engagement Rate"
          value={`${stats.engagementRate}%`}
          icon={Heart}
        />
        <StatCard
          title="Connected Platforms"
          value={stats.connectedPlatforms}
          icon={Link2}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.platformBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {stats.platformBreakdown.map(
                (p: { _id: string; totalViews: number; totalEngagement: number }) => (
                  <div key={p._id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Badge variant="outline" className="w-fit capitalize">
                      {p._id}
                    </Badge>
                    <span className="text-sm text-slate-600">
                      {p.totalViews.toLocaleString()} views · {p.totalEngagement.toLocaleString()} engagement
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Connect platforms and publish your first post to see performance data.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
