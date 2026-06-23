"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
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

  const oauthError = searchParams.get("error");
  const oauthErrorDetail = searchParams.get("error_detail");
  const connectedPlatform = searchParams.get("connected");

  useEffect(() => {
    if (connectedPlatform || oauthError) {
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
    }
  }, [searchParams, queryClient, connectedPlatform, oauthError]);

  const errorMessages: Record<string, string> = {
    oauth_failed: "Connection failed. Check redirect URI and app credentials.",
    tiktok_sandbox:
      "TikTok Sandbox: add your TikTok account as a Target User in developers.tiktok.com → your app → Sandbox → Target users.",
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500">Manage your connected social accounts.</p>
        </div>
        <Badge variant={connectedCount > 0 ? "success" : "outline"} className="text-sm px-3 py-1">
          {connectedCount} of {totalCount} connected
        </Badge>
      </div>

      {connectedPlatform && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1)} connected
          successfully. You can now publish to this platform.
        </div>
      )}

      {oauthError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessages[oauthErrorDetail ?? oauthError] ?? errorMessages.oauth_failed}
        </div>
      )}

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
              className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
            >
              <div className="flex items-center gap-3">
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
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={p.connected ? "success" : "outline"}>
                  {p.connected ? "Connected" : "Not connected"}
                </Badge>
                <Button
                  size="sm"
                  variant={p.connected ? "outline" : "default"}
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
