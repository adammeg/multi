import { postRepository, scheduledPostRepository } from "@/features/posts/repositories/post.repository";
import { subscriptionRepository } from "@/features/subscription/repositories/subscription.repository";
import { activityLogRepository } from "@/features/analytics/repositories/analytics.repository";
import { videoService } from "@/features/posts/services/video.service";
import { publishingService } from "@/features/platforms/services/publishing.service";
import { connectedAccountRepository } from "@/features/platforms/repositories/connected-account.repository";
import { getStorage } from "@/lib/storage/adapter";
import { AppError } from "@/lib/utils/api-response";
import { checkPostLimit } from "@/lib/middleware/subscription.middleware";
import type { CreatePostDto } from "@/features/posts/dto/post.dto";
import type { Platform, PostStatus } from "@/types";
import { getPublishQueue } from "@/lib/queue/publish.queue";

export class PostService {
  async createPostFromUrl(
    userId: string,
    dto: CreatePostDto,
    videoUrl: string,
    filename: string
  ) {
    const response = await fetch(videoUrl);
    if (!response.ok) {
      throw new AppError("Failed to fetch uploaded video", 400, "VIDEO_FETCH_FAILED");
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new AppError("Uploaded video is empty", 400, "VIDEO_EMPTY");
    }
    return this.createPost(userId, dto, buffer, filename);
  }

  async createPost(
    userId: string,
    dto: CreatePostDto,
    videoBuffer: Buffer,
    filename: string
  ) {
    await checkPostLimit(userId);
    await this.assertPlatformsConnected(userId, dto.platforms);

    const storage = getStorage();
    const videoPath = await storage.save(videoBuffer, filename);

    const validation = await videoService.validateVideo(videoPath);
    if (!validation.valid) {
      await videoService.deleteFile(videoPath);
      throw new AppError(validation.errors.join("; "), 400, "VALIDATION_FAILED");
    }

    let thumbnailPath: string | undefined;
    try {
      thumbnailPath = await videoService.generateThumbnail(videoPath);
    } catch {
      // Thumbnail is optional
    }

    const isScheduled = !!dto.scheduledFor;
    const post = await postRepository.create({
      userId: userId as unknown as import("mongoose").Types.ObjectId,
      caption: dto.caption,
      hashtags: dto.hashtags,
      platforms: dto.platforms,
      videoPath,
      thumbnailPath,
      videoMetadata: validation.metadata,
      status: isScheduled ? "PENDING" : "PROCESSING",
      isScheduled,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : undefined,
    });

    if (isScheduled && dto.scheduledFor) {
      const scheduled = await scheduledPostRepository.create({
        userId: userId as unknown as import("mongoose").Types.ObjectId,
        postId: post._id,
        scheduledFor: new Date(dto.scheduledFor),
        status: "QUEUED",
      });

      const queue = getPublishQueue();
      const delay = new Date(dto.scheduledFor).getTime() - Date.now();
      const job = await queue.add(
        "scheduled-publish",
        { postId: post._id.toString(), scheduledPostId: scheduled._id.toString() },
        {
          delay: Math.max(0, delay),
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        }
      );

      await scheduledPostRepository.update(scheduled._id.toString(), {
        jobId: job.id,
      });
    } else {
      await this.processPublish(post._id.toString());
    }

    await subscriptionRepository.incrementPostsUsed(userId);
    await activityLogRepository.create({
      userId: userId as unknown as import("mongoose").Types.ObjectId,
      action: "POST_CREATE",
      resource: "post",
      resourceId: post._id.toString(),
    });

    return post;
  }

  private async assertPlatformsConnected(userId: string, platforms: Platform[]) {
    const connected = await connectedAccountRepository.findByUserId(userId);
    const connectedIds = new Set(connected.map((c) => c.platform));
    const missing = platforms.filter((p) => !connectedIds.has(p));
    if (missing.length > 0) {
      throw new AppError(
        `Connect these platforms in Settings before publishing: ${missing.join(", ")}`,
        400,
        "PLATFORMS_NOT_CONNECTED"
      );
    }
  }

  async processPublish(postId: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new AppError("Post not found", 404);

    await postRepository.update(postId, { status: "PROCESSING" });

    const results = await publishingService.publishToAll(
      post.userId.toString(),
      post.platforms as Platform[],
      post.videoPath,
      post.caption,
      post.hashtags
    );

    const status = publishingService.determineStatus(results) as PostStatus;
    const errorLog = results.filter((r) => r.error).map((r) => `${r.platform}: ${r.error}`);

    await postRepository.update(postId, {
      status,
      platformResults: results,
      publishedAt: status !== "FAILED" ? new Date() : undefined,
      errorLog,
    });

    if (status === "SUCCESS" || status === "PARTIAL_SUCCESS") {
      await videoService.deleteFile(post.videoPath);
      if (post.thumbnailPath) await videoService.deleteFile(post.thumbnailPath);
    }

    return { status, results };
  }

  async getPosts(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const posts = await postRepository.findByUserId(userId, skip, limit);
    const total = await postRepository.countByUser(userId);
    return { posts, total, page, limit };
  }

  async getPost(userId: string, postId: string) {
    const post = await postRepository.findById(postId);
    if (!post || post.userId.toString() !== userId) {
      throw new AppError("Post not found", 404);
    }
    return post;
  }
}

export const postService = new PostService();
