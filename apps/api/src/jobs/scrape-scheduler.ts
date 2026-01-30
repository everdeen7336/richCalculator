import cron from 'node-cron';
import { Terminal, CACHE_TTL, isPeakHours } from '@incheon-dashboard/shared';
import { ParkingScraper } from '../scrapers/parking.scraper';
import { CongestionScraper } from '../scrapers/congestion.scraper';
import { MemoryCache, getParkingCacheKey, getCongestionCacheKey } from '../cache/memory-cache';
import { Logger } from '../utils/logger';

export class ScrapeScheduler {
  private logger = new Logger('Scheduler');
  private isRunning = false;

  constructor(
    private parkingCache: MemoryCache<any>,
    private congestionCache: MemoryCache<any>
  ) {}

  start(): void {
    if (this.isRunning) {
      this.logger.warn('Scheduler already running');
      return;
    }

    this.isRunning = true;
    this.logger.info('Starting scrape scheduler');

    // 주차장: 30초마다 (혼잡시간대 15초)
    cron.schedule('*/30 * * * * *', () => this.scrapeParkingAll());

    // 혼잡도: 1분마다
    cron.schedule('*/1 * * * *', () => this.scrapeCongestionAll());

    // 혼잡시간대 주차장 추가 스크래핑 (15초 간격)
    cron.schedule('*/15 * * * * *', () => {
      if (isPeakHours()) {
        this.scrapeParkingAll();
      }
    });

    // 초기 데이터 로드
    this.logger.info('Loading initial data...');
    this.loadInitialData();
  }

  stop(): void {
    this.isRunning = false;
    this.logger.info('Scheduler stopped');
  }

  private async loadInitialData(): Promise<void> {
    await Promise.all([this.scrapeParkingAll(), this.scrapeCongestionAll()]);
    this.logger.info('Initial data loaded');
  }

  private async scrapeParkingAll(): Promise<void> {
    const terminals = Object.values(Terminal);

    await Promise.all(
      terminals.map(async (terminal) => {
        try {
          const scraper = new ParkingScraper(terminal);
          const data = await scraper.scrape();
          const cacheKey = getParkingCacheKey(terminal);

          this.parkingCache.set(cacheKey, data, CACHE_TTL.PARKING);
          this.logger.debug(`Parking cache updated: ${terminal}`);
        } catch (error) {
          this.logger.error(`Parking scrape failed: ${terminal}`, error);
        }
      })
    );
  }

  private async scrapeCongestionAll(): Promise<void> {
    const terminals = Object.values(Terminal);

    await Promise.all(
      terminals.map(async (terminal) => {
        try {
          const scraper = new CongestionScraper(terminal);
          const data = await scraper.scrape();
          const cacheKey = getCongestionCacheKey(terminal);

          this.congestionCache.set(cacheKey, data, CACHE_TTL.CONGESTION);
          this.logger.debug(`Congestion cache updated: ${terminal}`);
        } catch (error) {
          this.logger.error(`Congestion scrape failed: ${terminal}`, error);
        }
      })
    );
  }

  /**
   * 수동으로 특정 터미널 데이터 갱신
   */
  async refreshParking(terminal: Terminal): Promise<void> {
    try {
      const scraper = new ParkingScraper(terminal);
      const data = await scraper.scrape();
      const cacheKey = getParkingCacheKey(terminal);

      this.parkingCache.set(cacheKey, data, CACHE_TTL.PARKING);
      this.logger.info(`Parking manually refreshed: ${terminal}`);
    } catch (error) {
      this.logger.error(`Manual parking refresh failed: ${terminal}`, error);
      throw error;
    }
  }

  async refreshCongestion(terminal: Terminal): Promise<void> {
    try {
      const scraper = new CongestionScraper(terminal);
      const data = await scraper.scrape();
      const cacheKey = getCongestionCacheKey(terminal);

      this.congestionCache.set(cacheKey, data, CACHE_TTL.CONGESTION);
      this.logger.info(`Congestion manually refreshed: ${terminal}`);
    } catch (error) {
      this.logger.error(`Manual congestion refresh failed: ${terminal}`, error);
      throw error;
    }
  }
}
