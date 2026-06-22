import { DashboardLayout } from "@/components/dashboard/sidebar";
import { TrendsList } from "@/components/dashboard/trends-list";

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <TrendsList />
    </DashboardLayout>
  );
}
