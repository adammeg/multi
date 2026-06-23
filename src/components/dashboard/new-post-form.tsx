"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatforms } from "@/hooks/use-platforms";
import { formatBlobUploadError, getUploadAuthHeaders } from "@/lib/auth/client-auth";
import type { Platform } from "@/types";

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function NewPostForm() {
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [scheduledFor, setScheduledFor] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const { accessToken } = useAuthStore();
  const router = useRouter();
  const { data: platformsData, isLoading: platformsLoading } = usePlatforms();

  const allPlatforms = platformsData?.platforms ?? [];
  const connectedPlatforms = allPlatforms.filter((p) => p.connected);
  const connectedCount = platformsData?.connectedCount ?? 0;

  const authHeaders: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const hasInitializedPlatforms = useRef(false);

  useEffect(() => {
    if (!hasInitializedPlatforms.current && connectedPlatforms.length > 0) {
      setPlatforms(connectedPlatforms.map((p) => p.id));
      hasInitializedPlatforms.current = true;
    }
  }, [connectedPlatforms]);

  function togglePlatform(p: Platform) {
    if (!connectedPlatforms.some((cp) => cp.id === p)) return;
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  async function createPostWithBlobUpload() {
    if (!video) return;

    const headers = await getUploadAuthHeaders();
    if (!headers.Authorization) {
      throw new Error("Your session expired. Log out, log in again, then retry the upload.");
    }

    setStatus("Uploading video...");
    try {
      const blob = await upload(video.name, video, {
        access: "public",
        handleUploadUrl: "/api/posts/upload",
        headers,
        multipart: video.size > 20 * 1024 * 1024,
      });

      setStatus("Processing video...");
      const res = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          caption,
          hashtags: hashtags.split(/\s+/).filter(Boolean),
          platforms,
          scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
          videoUrl: blob.url,
          videoFilename: video.name,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create post");
    } catch (err) {
      throw new Error(formatBlobUploadError(err));
    }
  }

  async function createPostWithFormData() {
    if (!video) return;

    const formData = new FormData();
    formData.append("video", video);
    formData.append("caption", caption);
    formData.append("hashtags", JSON.stringify(hashtags.split(/\s+/).filter(Boolean)));
    formData.append("platforms", JSON.stringify(platforms));
    if (scheduledFor) formData.append("scheduledFor", new Date(scheduledFor).toISOString());

    setStatus("Uploading video...");
    const res = await fetch("/api/posts", {
      method: "POST",
      credentials: "include",
      headers: authHeaders,
      body: formData,
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error ?? "Failed to create post");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!video) {
      setError("Please select a video");
      return;
    }
    if (platforms.length === 0) {
      setError("Select at least one connected platform");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("");

    try {
      if (isLocalDevHost()) {
        await createPostWithFormData();
      } else {
        await createPostWithBlobUpload();
      }
      router.push("/dashboard/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  if (platformsLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          Loading connected platforms...
        </CardContent>
      </Card>
    );
  }

  if (connectedCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create New Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center py-8">
          <p className="text-slate-600">No platforms connected yet.</p>
          <p className="text-sm text-slate-500">
            Connect TikTok, Instagram, Facebook, or YouTube before publishing.
          </p>
          <Button asChild>
            <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <CardTitle className="text-lg sm:text-xl">Create New Post</CardTitle>
          <Badge variant="success">
            {connectedCount} platform{connectedCount !== 1 ? "s" : ""} connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="video">Video (9:16, max 60s)</Label>
            <Input
              id="video"
              type="file"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <textarea
              id="caption"
              className="flex min-h-[100px] w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (space separated)</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#Tunisia #ContentCreator"
            />
          </div>

          <div className="space-y-2">
            <Label>Publish to (connected only)</Label>
            <div className="flex flex-wrap gap-2">
              {allPlatforms.map((p) => {
                const isConnected = p.connected;
                const isSelected = platforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!isConnected}
                    onClick={() => togglePlatform(p.id)}
                    title={
                      isConnected
                        ? p.account?.platformUsername
                          ? `Connected as ${p.account.platformUsername}`
                          : undefined
                        : "Connect in Settings first"
                    }
                    className="focus:outline-none disabled:cursor-not-allowed"
                  >
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className={!isConnected ? "opacity-40 line-through" : ""}
                    >
                      {p.name}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              Only connected platforms can be selected.{" "}
              <Link href="/dashboard/settings" className="text-violet-600 hover:underline">
                Connect more in Settings
              </Link>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule (optional, max 30 days)</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {status && <p className="text-sm text-slate-600">{status}</p>}

          <Button type="submit" disabled={loading || platforms.length === 0} className="w-full sm:w-auto">
            {loading ? status || "Working..." : scheduledFor ? "Schedule Post" : "Publish Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
