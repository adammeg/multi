"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";

async function fetchAnalytics(type: string, token: string | null) {
  const res = await fetch(`/api/analytics?type=${type}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data ?? [];
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

  const { data: viewsData = [] } = useQuery({
    queryKey: ["analytics-views"],
    queryFn: () => fetchAnalytics("views", accessToken),
  });

  const { data: engagementData = [] } = useQuery({
    queryKey: ["analytics-engagement"],
    queryFn: () => fetchAnalytics("engagement", accessToken),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => fetchAnalytics("dashboard", accessToken),
  });

  const platformData =
    dashboard?.platformBreakdown?.map(
      (p: { _id: string; totalViews: number; totalEngagement: number }) => ({
        platform: p._id,
        views: p.totalViews,
        engagement: p.totalEngagement,
      })
    ) ?? [];

  const hasViews = viewsData.length > 0;
  const hasEngagement = engagementData.length > 0;
  const hasPlatformData = platformData.length > 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Analytics</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          Performance from your synced account data.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {hasViews ? (
              <div className="min-w-[280px]">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={viewsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No view data yet. Sync your connected accounts to see trends." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Over Time</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {hasEngagement ? (
              <div className="min-w-[280px]">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} />
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
            <CardTitle>Platform Comparison</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {hasPlatformData ? (
              <div className="min-w-[300px]">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={platformData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#7c3aed" />
                    <Bar dataKey="engagement" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="Connect and sync platforms to compare performance." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
