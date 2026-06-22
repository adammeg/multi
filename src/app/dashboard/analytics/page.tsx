import { DashboardLayout } from "@/components/dashboard/sidebar";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <AnalyticsCharts />
    </DashboardLayout>
  );
}
