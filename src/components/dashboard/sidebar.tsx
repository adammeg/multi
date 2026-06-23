"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  FileVideo,
  PlusCircle,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
  Clapperboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/stores/auth.store";
import { usePlatforms } from "@/hooks/use-platforms";
import { Button } from "@/components/ui/button";
import { ConnectPlatformsAlert } from "@/components/dashboard/connect-platforms-alert";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/my-reels", label: "My Reels", icon: Clapperboard },
  { href: "/dashboard/posts", label: "Posts", icon: FileVideo },
  { href: "/dashboard/new-post", label: "New Post", icon: PlusCircle },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/trends", label: "Trends", icon: TrendingUp },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar, closeSidebar } = useUIStore();
  const { user, logout } = useAuthStore();
  const { data: platformsData } = usePlatforms();
  const connectedCount = platformsData?.connectedCount ?? 0;
  const totalCount = platformsData?.totalCount ?? 4;

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 h-10 w-10 bg-white/90 shadow-sm backdrop-blur lg:hidden"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close menu overlay"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[min(18rem,85vw)] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 ease-out lg:w-64 lg:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center border-b border-slate-200 px-4 sm:h-16 sm:px-6">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2" onClick={closeSidebar}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white">
              MP
            </div>
            <span className="truncate font-semibold text-slate-900">MultiPoster TN</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 sm:p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSidebar}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-violet-50 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.href === "/dashboard/settings" && (
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      connectedCount > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}
                  >
                    {connectedCount}/{totalCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3 sm:p-4">
          <div className="mb-1 truncate text-sm font-medium text-slate-900">
            {user?.name ?? "User"}
          </div>
          <div className="mb-3 truncate text-xs text-slate-500">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50">
      <DashboardSidebar />
      <main className="min-w-0 lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-14 sm:px-6 sm:pt-16 lg:px-8 lg:pt-6">
          <ConnectPlatformsAlert />
          {children}
        </div>
      </main>
    </div>
  );
}
