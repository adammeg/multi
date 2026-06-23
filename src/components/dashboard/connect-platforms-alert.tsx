"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlatforms } from "@/hooks/use-platforms";

export function ConnectPlatformsAlert() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const { data, isLoading } = usePlatforms();

  const connectedCount = data?.connectedCount ?? 0;
  const totalCount = data?.totalCount ?? 4;
  const hasConnectedPlatform = connectedCount > 0;
  const allConnected = connectedCount >= totalCount;

  const isSettingsPage = pathname.startsWith("/dashboard/settings");

  if (isLoading || allConnected || isSettingsPage || dismissed) {
    return null;
  }

  return (
    <div
      className={cn(
        "sticky top-12 z-20 -mx-4 mb-4 border border-amber-200 bg-amber-50 px-3 py-3 sm:-mx-6 sm:mb-6 sm:px-4",
        "lg:static lg:mx-0 lg:mb-6 lg:rounded-lg lg:top-auto"
      )}
      role="alert"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-3 lg:items-center">
        <div className="flex gap-3 sm:flex-1 sm:items-start lg:items-center">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900">
            {hasConnectedPlatform
              ? `${connectedCount} of ${totalCount} platforms connected`
              : "Connect your social accounts to start publishing"}
          </p>
          <p className="text-sm text-amber-700">
            {hasConnectedPlatform
              ? "Connect more platforms in Settings to publish everywhere, or post only to connected ones."
              : "Link TikTok, Instagram, Facebook, or YouTube before creating your first post."}
          </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
          <Button size="sm" asChild className="flex-1 sm:flex-none">
            <Link href="/dashboard/settings">
              {hasConnectedPlatform ? "Connect more" : "Connect now"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
