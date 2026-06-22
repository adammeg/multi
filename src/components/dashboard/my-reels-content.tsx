"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Sparkles,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import type { Platform } from "@/types";

async function fetchWithAuth(url: string, token: string | null, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data;
}

function viralScoreColor(score: number) {
  if (score >= 75) return "success";
  if (score >= 50) return "warning";
  return "error";
}

export function MyReelsContent() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: contentData, isLoading } = useQuery({
    queryKey: ["my-reels"],
    queryFn: () => fetchWithAuth("/api/content", accessToken),
  });

  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ["content-recommendations"],
    queryFn: () => fetchWithAuth("/api/content?section=recommendations", accessToken),
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/content", accessToken, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reels"] });
      queryClient.invalidateQueries({ queryKey: ["content-recommendations"] });
    },
  });

  const videos = contentData?.videos ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Reels</h1>
          <p className="text-slate-500">
            Sync videos from connected accounts and get viral growth recommendations.
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Syncing..." : "Sync from accounts"}
        </Button>
      </div>

      {syncMutation.isSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {(syncMutation.data as { message?: string })?.message}
        </div>
      )}

      {/* Recommendations panel */}
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Viral Growth Coach
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisLoading ? (
            <p className="text-sm text-slate-500">Analyzing your content...</p>
          ) : analysis ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-white p-4 border border-slate-100">
                  <p className="text-sm text-slate-500">Total videos</p>
                  <p className="text-2xl font-bold">{analysis.totalVideos}</p>
                </div>
                <div className="rounded-lg bg-white p-4 border border-slate-100">
                  <p className="text-sm text-slate-500">Total views</p>
                  <p className="text-2xl font-bold">{analysis.totalViews.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-white p-4 border border-slate-100">
                  <p className="text-sm text-slate-500">Avg engagement</p>
                  <p className="text-2xl font-bold">{analysis.avgEngagementRate}%</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="outline">
                  <Clock className="mr-1 h-3 w-3" />
                  Best: {analysis.bestPostingDay} at {analysis.bestPostingHour}:00
                </Badge>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Recommendations to go viral</h3>
                {analysis.recommendations?.map(
                  (rec: {
                    type: string;
                    priority: string;
                    title: string;
                    description: string;
                    impact: string;
                  },
                  i: number) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-violet-600" />
                            <span className="font-medium text-slate-900">{rec.title}</span>
                            <Badge
                              variant={
                                rec.priority === "high"
                                  ? "default"
                                  : rec.priority === "medium"
                                    ? "warning"
                                    : "outline"
                              }
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{rec.description}</p>
                        </div>
                        <span className="shrink-0 text-xs font-medium text-emerald-600">
                          {rec.impact}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              {analysis.topPerformers?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-semibold text-slate-900">Top performers</h3>
                  <div className="space-y-2">
                    {analysis.topPerformers.map(
                      (v: { title: string; platform: string; viralScore: number; views: number }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="truncate">{v.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="capitalize">{v.platform}</Badge>
                            <Badge variant={viralScoreColor(v.viralScore)}>{v.viralScore}/100</Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Video list */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Your videos & reels</h2>
        {isLoading ? (
          <p className="text-slate-500">Loading...</p>
        ) : videos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500">No videos synced yet.</p>
              <p className="mt-1 text-sm text-slate-400">
                Connect accounts in Settings, then click &quot;Sync from accounts&quot;.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {videos.map(
              (video: {
                _id: string;
                title: string;
                platform: Platform;
                views: number;
                likes: number;
                comments: number;
                viralScore?: number;
                engagementRate?: number;
                publishedAt: string;
                permalink?: string;
                analysis?: { strengths: string[]; weaknesses: string[]; recommendations: string[] };
                hashtags: string[];
              }) => (
                <Card key={video._id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                        9:16
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-slate-900 truncate">{video.title}</h3>
                          <Badge variant="outline" className="capitalize">{video.platform}</Badge>
                          {video.viralScore != null && (
                            <Badge variant={viralScoreColor(video.viralScore)}>
                              Viral {video.viralScore}/100
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {video.views.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {video.likes.toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            {video.comments}
                          </span>
                          {video.engagementRate != null && (
                            <span>{video.engagementRate}% engagement</span>
                          )}
                        </div>
                        {video.hashtags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {video.hashtags.slice(0, 5).map((tag: string) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                        {(video.analysis?.recommendations?.length ?? 0) > 0 && (
                          <div className="mt-3 rounded-lg bg-amber-50 p-3">
                            <p className="text-xs font-medium text-amber-800">Tips for this video:</p>
                            <ul className="mt-1 space-y-1">
                              {video.analysis?.recommendations?.map((r: string, i: number) => (
                                <li key={i} className="text-xs text-amber-700">• {r}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {video.permalink && video.permalink !== "#" && (
                        <a
                          href={video.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
