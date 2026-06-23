"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth.store";

async function fetchAdmin(section: string, token: string | null) {
  const res = await fetch(`/api/admin?section=${section}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  return json.data;
}

export function AdminDashboard() {
  const { accessToken } = useAuthStore();

  const { data: overview } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchAdmin("overview", accessToken),
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchAdmin("users", accessToken),
  });

  const { data: errors } = useQuery({
    queryKey: ["admin-errors"],
    queryFn: () => fetchAdmin("errors", accessToken),
  });

  return (
    <div className="space-y-6 p-4 sm:space-y-8 sm:p-6">
      <h1 className="text-xl font-bold sm:text-2xl">Admin Panel</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{overview?.totalUsers ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Posts</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{overview?.totalPosts ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Failed Posts</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{overview?.failedPosts ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Users</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users?.users?.map((u: { _id: string; name: string; email: string }) => (
              <div key={u._id} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:justify-between">
                <span className="font-medium">{u.name}</span>
                <span className="truncate text-slate-500">{u.email}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Error Logs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors?.map((log: { _id: string; action: string; createdAt: string }) => (
              <div key={log._id} className="text-sm text-slate-600">
                [{new Date(log.createdAt).toLocaleString()}] {log.action}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
