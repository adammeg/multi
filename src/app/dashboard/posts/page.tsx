import { DashboardLayout } from "@/components/dashboard/sidebar";
import { PostsList } from "@/components/dashboard/posts-list";

export default function PostsPage() {
  return (
    <DashboardLayout>
      <PostsList />
    </DashboardLayout>
  );
}
