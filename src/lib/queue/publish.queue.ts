import { Queue, Worker, Job } from "bullmq";
import { getEnv } from "@/lib/config/env";

function getConnectionOptions() {
  const url = new URL(getEnv().REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port || "6379", 10),
    maxRetriesPerRequest: null as null,
  };
}

let publishQueue: Queue | null = null;

export function getPublishQueue(): Queue {
  if (!publishQueue) {
    publishQueue = new Queue("publish", {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }
  return publishQueue;
}

export function getDeadLetterQueue(): Queue {
  return new Queue("publish-dlq", { connection: getConnectionOptions() });
}

export interface PublishJobData {
  postId: string;
  scheduledPostId?: string;
}

export function createPublishWorker() {
  const worker = new Worker<PublishJobData>(
    "publish",
    async (job: Job<PublishJobData>) => {
      const { connectDB } = await import("@/lib/db/connection");
      await connectDB();

      const { postService } = await import("@/features/posts/services/post.service");
      const { scheduledPostRepository } = await import(
        "@/features/posts/repositories/post.repository"
      );

      if (job.data.scheduledPostId) {
        const { ScheduledPost } = await import("@/lib/db/models");
        await ScheduledPost.findByIdAndUpdate(job.data.scheduledPostId, {
          status: "PROCESSING",
          lastAttemptAt: new Date(),
          $inc: { attempts: 1 },
        });
      }

      const result = await postService.processPublish(job.data.postId);

      if (job.data.scheduledPostId) {
        await scheduledPostRepository.update(job.data.scheduledPostId, {
          status: result.status === "FAILED" ? "FAILED" : "COMPLETED",
        });
      }

      return result;
    },
    {
      connection: getConnectionOptions(),
      concurrency: 5,
    }
  );

  worker.on("failed", async (job, err) => {
    if (job && job.attemptsMade >= (job.opts.attempts ?? 3)) {
      const dlq = getDeadLetterQueue();
      await dlq.add("failed-publish", {
        ...job.data,
        error: err.message,
        failedAt: new Date().toISOString(),
      });
    }
  });

  return worker;
}

export function createTrendWorker() {
  return new Worker(
    "trends",
    async () => {
      const { connectDB } = await import("@/lib/db/connection");
      await connectDB();
      const { trendService } = await import("@/features/trends/services/trend.service");
      await trendService.fetchAndStoreTrends();
    },
    { connection: getConnectionOptions() }
  );
}

export async function scheduleTrendCollection() {
  const queue = new Queue("trends", { connection: getConnectionOptions() });
  await queue.add(
    "fetch-trends",
    {},
    {
      repeat: { every: 6 * 60 * 60 * 1000 },
      jobId: "trend-collection",
    }
  );
}
