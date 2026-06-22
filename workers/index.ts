import { createPublishWorker, createTrendWorker, scheduleTrendCollection } from "../src/lib/queue/publish.queue";

async function main() {
  console.log("[Worker] Starting MultiPoster TN workers...");

  const { connectDB: dbConnect } = await import("../src/lib/db/connection");
  await dbConnect();

  const publishWorker = createPublishWorker();
  const trendWorker = createTrendWorker();

  await scheduleTrendCollection();
  console.log("[Worker] Trend collection scheduled every 6 hours");

  publishWorker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  publishWorker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log("[Worker] Publish and trend workers running");

  process.on("SIGTERM", async () => {
    await publishWorker.close();
    await trendWorker.close();
    process.exit(0);
  });
}

main().catch(console.error);
