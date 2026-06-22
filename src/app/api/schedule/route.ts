import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/auth.middleware";
import { schedulePostSchema } from "@/features/posts/dto/post.dto";
import { postRepository, scheduledPostRepository } from "@/features/posts/repositories/post.repository";
import { getPublishQueue } from "@/lib/queue/publish.queue";
import { requirePlan } from "@/lib/middleware/subscription.middleware";
import { handleApiError, parseBody, successResponse } from "@/lib/utils/api-handler";
import { AppError } from "@/lib/utils/api-response";

export async function POST(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    await requirePlan("PRO", "AGENCY")(user.userId);

    const dto = await parseBody(request, schedulePostSchema);
    const post = await postRepository.findById(dto.postId);
    if (!post || post.userId.toString() !== user.userId) {
      throw new AppError("Post not found", 404);
    }

    const scheduled = await scheduledPostRepository.create({
      userId: user.userId as unknown as import("mongoose").Types.ObjectId,
      postId: post._id,
      scheduledFor: new Date(dto.scheduledFor),
      status: "QUEUED",
    });

    const delay = new Date(dto.scheduledFor).getTime() - Date.now();
    const queue = getPublishQueue();
    const job = await queue.add(
      "scheduled-publish",
      { postId: post._id.toString(), scheduledPostId: scheduled._id.toString() },
      { delay: Math.max(0, delay), attempts: 3, backoff: { type: "exponential", delay: 5000 } }
    );

    await scheduledPostRepository.update(scheduled._id.toString(), { jobId: job.id });
    await postRepository.update(post._id.toString(), {
      isScheduled: true,
      scheduledFor: new Date(dto.scheduledFor),
      status: "PENDING",
    });

    return successResponse(scheduled, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await withAuth(request);
    const scheduled = await scheduledPostRepository.findByUserId(user.userId);
    return successResponse(scheduled);
  } catch (error) {
    return handleApiError(error);
  }
}
