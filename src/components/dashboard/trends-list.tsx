"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

async function fetchTrends() {
  const res = await fetch("/api/trends?country=TN");
  const json = await res.json();
  return json.data ?? [];
}

export function TrendsList() {
  const { data: trends = [], isLoading } = useQuery({
    queryKey: ["trends"],
    queryFn: fetchTrends,
  });

  if (isLoading) return <div className="text-slate-500">Loading trends...</div>;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Trends</h1>
        <p className="text-sm text-slate-500 sm:text-base">Discover what&apos;s trending in Tunisia.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {trends.map(
          (trend: {
            _id: string;
            name: string;
            growthPercent: number;
            category: string;
            platform: string;
          }) => (
            <Card key={trend._id}>
              <CardHeader className="pb-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base">{trend.name}</CardTitle>
                  <Badge variant="success">+{Math.round(trend.growthPercent)}%</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Badge variant="outline" className="capitalize">
                    {trend.platform}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {trend.category}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {trends.length === 0 && (
        <p className="text-sm text-slate-500">No trends available yet. Check back soon.</p>
      )}
    </div>
  );
}
