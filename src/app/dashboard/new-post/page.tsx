import { DashboardLayout } from "@/components/dashboard/sidebar";
import { NewPostForm } from "@/components/dashboard/new-post-form";

export default function NewPostPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Post</h1>
          <p className="text-slate-500">Upload and publish to multiple platforms.</p>
        </div>
        <NewPostForm />
      </div>
    </DashboardLayout>
  );
}
