import "dotenv/config";
import { connectDB, connectRedis, redisClient, registerGracefulShutdown, createLockedScheduler, logger } from "@booking/shared";
import { runCampaignWorkerTick } from "./campaignWorker";

const TICK_MS = 3_000;

const campaignScheduler = createLockedScheduler({
  lockKey:     "lock:campaign-worker:tick",
  lockTtlSec:  60,
  tickMs:      TICK_MS,
  serviceName: "campaign-worker",
  onTick:      runCampaignWorkerTick,
});

async function main(): Promise<void> {
  registerGracefulShutdown({
    serviceName: "campaign-worker",
    redisClient,
    onBeforeDisconnect: () => { campaignScheduler.stop(); },
  });

  await connectDB();
  await connectRedis();

  campaignScheduler.start();

  logger.info("campaign_worker_process_started", { event: "campaign_worker_process_started", tickMs: TICK_MS });
}

main().catch((err) => {
  logger.error("campaign_worker_fatal", { error: (err as Error).message });
  process.exit(1);
});