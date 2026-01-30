import { Terminal, ParkingInfo, ParkingApiResponse, CACHE_TTL } from '@incheon-dashboard/shared';
import { parkingCache, getParkingCacheKey } from '../cache/memory-cache';
import { ParkingScraper } from '../scrapers/parking.scraper';
import { Logger } from '../utils/logger';

export class ParkingService {
  private logger = new Logger('ParkingService');

  async getParkingInfo(terminal: Terminal, refresh = false): Promise<ParkingApiResponse> {
    const cacheKey = getParkingCacheKey(terminal);

    // 캐시 확인 (강제 새로고침이 아닌 경우)
    if (!refresh) {
      const cached = parkingCache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${terminal}`);
        return {
          success: true,
          data: cached,
          cachedAt: parkingCache.getTimestamp(cacheKey) || undefined,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 캐시 미스 또는 강제 새로고침 - 직접 스크래핑
    this.logger.info(`Cache miss or refresh requested: ${terminal}`);
    try {
      const scraper = new ParkingScraper(terminal);
      const data = await scraper.scrape();

      // 캐시 저장
      parkingCache.set(cacheKey, data, CACHE_TTL.PARKING);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch parking data: ${terminal}`, error);

      // 오래된 캐시라도 반환 시도
      const staleData = parkingCache.getWithMeta(cacheKey);
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
          message: 'Failed to fetch parking data',
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  getCacheTimestamp(terminal: Terminal): string | null {
    return parkingCache.getTimestamp(getParkingCacheKey(terminal));
  }
}

export const parkingService = new ParkingService();
