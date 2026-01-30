import {
  Terminal,
  TerminalCongestion,
  CongestionApiResponse,
  CACHE_TTL,
} from '@incheon-dashboard/shared';
import { congestionCache, getCongestionCacheKey } from '../cache/memory-cache';
import { CongestionScraper } from '../scrapers/congestion.scraper';
import { Logger } from '../utils/logger';

export class CongestionService {
  private logger = new Logger('CongestionService');

  async getCongestion(terminal: Terminal, refresh = false): Promise<CongestionApiResponse> {
    const cacheKey = getCongestionCacheKey(terminal);

    // 캐시 확인
    if (!refresh) {
      const cached = congestionCache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${terminal}`);
        return {
          success: true,
          data: cached,
          cachedAt: congestionCache.getTimestamp(cacheKey) || undefined,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 직접 스크래핑
    this.logger.info(`Cache miss or refresh requested: ${terminal}`);
    try {
      const scraper = new CongestionScraper(terminal);
      const data = await scraper.scrape();

      congestionCache.set(cacheKey, data, CACHE_TTL.CONGESTION);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch congestion data: ${terminal}`, error);

      // 오래된 캐시 반환 시도
      const staleData = congestionCache.getWithMeta(cacheKey);
      if (staleData) {
        this.logger.warn(`Returning stale cache data: ${terminal}`);
        return {
          success: true,
          data: staleData.data,
          cachedAt: new Date(staleData.timestamp).toISOString(),
          error: {
            code: 'STALE_DATA',
            message: 'Using cached data due to fetch error',
          },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        error: {
          code: 'SCRAPER_ERROR',
          message: 'Failed to fetch congestion data',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  getCacheTimestamp(terminal: Terminal): string | null {
    return congestionCache.getTimestamp(getCongestionCacheKey(terminal));
  }
}

export const congestionService = new CongestionService();
