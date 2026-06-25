"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TrendCategory } from "@/types";

type TrendItem = {
  _id: string;
  name: string;
  growthPercent: number;
  category: TrendCategory;
  platform: string;
  metadata?: {
    traffic?: string;
    views?: number;
    videoCount?: number;
    url?: string;
    source?: string;
  };
  fetchedAt?: string;
};

type TrendsResponse = {
  trends: TrendItem[];
  lastFetchedAt?: string;
  country: string;
};

const CATEGORIES: { id: TrendCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "entertainment", label: "Entertainment" },
  { id: "food", label: "Food" },
  { id: "fashion", label: "Fashion" },
  { id: "tech", label: "Tech" },
  { id: "travel", label: "Travel" },
  { id: "sports", label: "Sports" },
  { id: "education", label: "Education" },
  { id: "other", label: "Other" },
];

async function fetchTrends(category: TrendCategory | "all", refresh = false): Promise<TrendsResponse> {
  const params = new URLSearchParams({ country: "TN" });
  if (category !== "all") params.set("category", category);
  if (refresh) params.set("refresh", "1");

  const res = await fetch(`/api/trends?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to load trends");

  const data = json.data;
  if (Array.isArray(data)) {
    return { trends: data, country: "TN" };
  }
  return data as TrendsResponse;
}

async function refreshTrends(): Promise<TrendsResponse> {
  const res = await fetch("/api/trends?country=TN", { method: "POST" });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to refresh trends");
  return {
    trends: json.data.trends ?? [],
    lastFetchedAt: json.data.lastFetchedAt,
    country: json.data.country ?? "TN",
  };
}

function sourceLabel(source?: string) {
  if (source === "google_trends_rss") return "Google Trends";
  if (source === "youtube_most_popular") return "YouTube trending";
  if (source === "synced_content") return "Your synced content";
  return null;
}

export function TrendsList() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<TrendCategory | "all">("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["trends", category],
    queryFn: () => fetchTrends(category),
  });

  const refreshMutation = useMutation({
    mutationFn: refreshTrends,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trends"] });
    },
  });

  const trends = data?.trends ?? [];
  const lastUpdated = data?.lastFetchedAt
    ? new Date(data.lastFetchedAt).toLocaleString()
    : null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Trends</h1>
          <p className="text-sm text-slate-500 sm:text-base">
            Live trends for Tunisia — Google, YouTube, and hashtags from synced content.
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-slate-400">Last updated: {lastUpdated}</p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={refreshMutation.isPending}
          onClick={() => refreshMutation.mutate()}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`}
          />
          {refreshMutation.isPending ? "Refreshing..." : "Refresh trends"}
        </Button>
      </div>

      {refreshMutation.isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Trends updated successfully.
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load trends. Try refreshing.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={category === cat.id ? "default" : "outline"}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {trends.map((trend) => {
            const source = sourceLabel(trend.metadata?.source);
            const url = trend.metadata?.url;

            return (
              <Card key={trend._id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug line-clamp-2">
                      {trend.name}
                    </CardTitle>
                    <Badge variant="success" className="shrink-0">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +{Math.round(trend.growthPercent)}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="capitalize">
                      {trend.platform}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {trend.category}
                    </Badge>
                    {source && (
                      <Badge variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {trend.metadata?.traffic && (
                      <span>{trend.metadata.traffic} searches</span>
                    )}
                    {trend.metadata?.views != null && (
                      <span>{trend.metadata.views.toLocaleString()} views</span>
                    )}
                    {trend.metadata?.videoCount != null && (
                      <span>{trend.metadata.videoCount} videos</span>
                    )}
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-violet-600 hover:underline"
                    >
                      View on YouTube
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!isLoading && trends.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600">No trends in this category yet.</p>
            <Button
              className="mt-4"
              variant="outline"
              disabled={refreshMutation.isPending}
              onClick={() => refreshMutation.mutate()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Fetch trends now
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
