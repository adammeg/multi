"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth.store";

const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  PENDING: "outline",
  PROCESSING: "warning",
  SUCCESS: "success",
  FAILED: "error",
  PARTIAL_SUCCESS: "warning",
};

async function fetchPosts(token: string | null) {
  const res = await fetch("/api/posts", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data?.posts ?? [];
}

export function PostsList() {
  const { accessToken } = useAuthStore();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: () => fetchPosts(accessToken),
  });

  if (isLoading) return <div className="text-slate-500">Loading posts...</div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Posts</h1>
        <p className="text-sm text-slate-500 sm:text-base">View and manage your published content.</p>
      </div>

      <div className="grid gap-4">
        {posts.map(
          (post: {
            _id: string;
            caption: string;
            status: string;
            platforms: string[];
            createdAt: string;
            thumbnailPath?: string;
          }) => (
            <Card key={post._id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-3 sm:contents">
                  <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                    9:16
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {post.caption || "Untitled post"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={statusVariant[post.status] ?? "outline"}
                    className="shrink-0 self-start sm:hidden"
                  >
                    {post.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 sm:flex-1">
                  {post.platforms?.map((p: string) => (
                    <Badge key={p} variant="outline" className="capitalize text-xs">
                      {p}
                    </Badge>
                  ))}
                </div>
                <Badge
                  variant={statusVariant[post.status] ?? "outline"}
                  className="hidden shrink-0 sm:inline-flex"
                >
                  {post.status}
                </Badge>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {posts.length === 0 && (
        <p className="text-sm text-slate-500">No posts yet. Create your first post!</p>
      )}
    </div>
  );
}
