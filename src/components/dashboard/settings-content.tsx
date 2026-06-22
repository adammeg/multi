"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import type { Platform } from "@/types";

async function fetchPlatforms(token: string | null) {
  const res = await fetch("/api/platforms", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data ?? [];
}

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
  const { data: platforms = [] } = useQuery({
    queryKey: ["platforms"],
    queryFn: () => fetchPlatforms(accessToken),
  });

  useEffect(() => {
    if (searchParams.get("connected") || searchParams.get("error")) {
      queryClient.invalidateQueries({ queryKey: ["platforms"] });
    }
  }, [searchParams, queryClient]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your connected social accounts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map(
            (p: {
              id: Platform;
              name: string;
              description: string;
              connected: boolean;
              account: { platformUsername: string } | null;
            }) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div>
                  <div className="font-medium text-slate-900">{p.name}</div>
                  <div className="text-sm text-slate-500">{p.description}</div>
                  {p.connected && p.account && (
                    <div className="text-sm text-emerald-600 mt-1">
                      Connected as {p.account.platformUsername}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={p.connected ? "success" : "outline"}>
                    {p.connected ? "Connected" : "Not connected"}
                  </Badge>
                  {!p.connected && (
                    <Button size="sm" onClick={() => connectPlatform(p.id, accessToken)}>
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
