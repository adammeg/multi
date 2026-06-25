"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatforms } from "@/hooks/use-platforms";
import type { Platform } from "@/types";

async function connectPlatform(platform: Platform, token: string | null) {
  const res = await fetch(`/api/oauth/${platform}/connect?platform=${platform}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (json.data?.authUrl) window.location.href = json.data.authUrl;
}

export function SettingsContent() {
  const { accessToken } = useAuthStore();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data } = usePlatforms();
  const platforms = data?.platforms ?? [];
  const connectedCount = data?.connectedCount ?? 0;
  const totalCount = data?.totalCount ?? 4;
  const plan = data?.plan ?? "FREE";
  const accountLimit = data?.connectedAccountsLimit ?? 1;

  const oauthError = searchParams.get("error");
  const oauthErrorDetail = searchParams.get("error_detail");
  const connectedPlatform = searchParams.get("connected");
  const justSynced = searchParams.get("synced") === "1";

  useEffect(() => {
    if (connectedPlatform || oauthError) {
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
      queryClient.invalidateQueries({ queryKey: ["my-reels"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-views"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-engagement"] });
    }
  }, [searchParams, queryClient, connectedPlatform, oauthError]);

  const errorMessages: Record<string, string> = {
    oauth_failed: "Connection failed. Check redirect URI and app credentials.",
    tiktok_sandbox:
      "TikTok Sandbox: add your TikTok account as a Target User in developers.tiktok.com → your app → Sandbox → Target users.",
    tiktok_denied: "TikTok authorization was cancelled or denied.",
    youtube_access_denied:
      "Google blocked access (403). Your Google account must be added as a Test user in Google Cloud → OAuth consent screen → Test users. Enable YouTube Data API v3 and use the same Gmail you add as test user.",
    missing_code_or_state: "OAuth did not return an authorization code. Check your redirect URI.",
  };

  const rawDetail = oauthErrorDetail;
  const oauthErrorMessage =
    rawDetail && !errorMessages[rawDetail]
      ? decodeURIComponent(rawDetail)
      : errorMessages[rawDetail ?? oauthError ?? ""] ?? errorMessages.oauth_failed;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Settings</h1>
          <p className="text-sm text-slate-500 sm:text-base">Manage your connected social accounts.</p>
        </div>
        <Badge variant={connectedCount > 0 ? "success" : "outline"} className="text-sm px-3 py-1">
          {connectedCount} of {accountLimit} connected · {plan} plan
        </Badge>
      </div>

      {connectedPlatform && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connected
          successfully.
          {justSynced
            ? " Your videos and stats were synced automatically."
            : " Sync your content from My Reels or the Dashboard."}
        </div>
      )}

      {oauthError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {oauthErrorMessage}
        </div>
      )}

      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-blue-900">YouTube / Google OAuth (403 access_denied)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>
            If Google shows <strong>403 access_denied</strong>, add your Gmail under{" "}
            <strong>Google Cloud → OAuth consent screen → Test users</strong>.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Enable <strong>YouTube Data API v3</strong></li>
            <li>Add scopes: <code className="text-xs">youtube.upload</code>, <code className="text-xs">youtube.readonly</code></li>
            <li>Add your Gmail as a <strong>Test user</strong></li>
            <li>Redirect URI: <code className="text-xs">https://multi-flame.vercel.app/api/oauth/youtube/callback</code></li>
            <li>Use the same Gmail when connecting in Settings</li>
          </ol>
          <p className="text-blue-800">
            Full guide: Google Cloud Console → OAuth consent screen → Test users.
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-amber-900">TikTok Sandbox (development)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>
            If TikTok shows <strong>non_sandbox_target</strong>, your TikTok account is not allowed
            yet. In development mode, only <strong>Target Users</strong> can connect.
          </p>
          <ol className="list-decimal list-inside space-y-1 text-amber-800">
            <li>Open <a className="underline" href="https://developers.tiktok.com" target="_blank" rel="noreferrer">developers.tiktok.com</a> → your app</li>
            <li>Switch to <strong>Sandbox</strong> mode (top of app page)</li>
            <li>Go to <strong>Sandbox settings → Target users → Add account</strong></li>
            <li>Log in with the <em>same</em> TikTok account you use to connect</li>
            <li>Use Sandbox <strong>Client key</strong> in Vercel env vars</li>
            <li>Redirect URI: <code className="text-xs">https://multi-flame.vercel.app/api/oauth/tiktok/callback</code></li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-3">
                {p.connected && p.account?.profilePicture && (
                  <img
                    src={p.account.profilePicture}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.description}</div>
                  {p.connected && p.account && (
                    <div className="text-sm text-emerald-600 mt-1">
                      Connected as @{p.account.platformUsername}
                      {p.account.lastSyncedAt && (
                        <span className="block text-xs text-slate-500 mt-0.5">
                          Last synced:{" "}
                          {new Date(p.account.lastSyncedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
                <Badge variant={p.connected ? "success" : "outline"}>
                  {p.connected ? "Connected" : "Not connected"}
                </Badge>
                <Button
                  size="sm"
                  variant={p.connected ? "outline" : "default"}
                  className="w-full sm:w-auto"
                  onClick={() => connectPlatform(p.id, accessToken)}
                >
                  {p.connected ? "Reconnect" : "Connect"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
