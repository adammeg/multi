import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { postService } from "@/features/posts/services/post.service";
import { handleApiError, successResponse } from "@/lib/utils/api-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await withAuth(request);
    const { id } = await params;
    const post = await postService.getPost(user.userId, id);
    return successResponse(post);
  } catch (error) {
    return handleApiError(error);
  }
}
