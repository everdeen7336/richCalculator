import { createApp } from './app';
import { ScrapeScheduler } from './jobs/scrape-scheduler';
import { parkingCache, congestionCache } from './cache/memory-cache';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

async function main() {
  const app = createApp();

  // 스케줄러 시작
  const scheduler = new ScrapeScheduler(parkingCache, congestionCache);
  scheduler.start();

  app.listen(PORT, () => {
    logger.info(`API server running on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
