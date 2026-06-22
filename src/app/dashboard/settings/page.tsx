import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard/sidebar";
import { SettingsContent } from "@/components/dashboard/settings-content";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="text-slate-500">Loading settings...</div>}>
        <SettingsContent />
      </Suspense>
    </DashboardLayout>
  );
}
