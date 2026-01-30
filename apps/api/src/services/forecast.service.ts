import {
  Terminal,
  CongestionForecast,
  CongestionForecastApiResponse,
  CACHE_TTL,
} from '@incheon-dashboard/shared';
import { forecastCache, getForecastCacheKey } from '../cache/memory-cache';
import { scrapeForecast } from '../scrapers/forecast.scraper';
import { Logger } from '../utils/logger';

class ForecastService {
  private logger = new Logger('ForecastService');

  async getForecast(terminal: Terminal, date: string, refresh = false): Promise<CongestionForecastApiResponse> {
    const cacheKey = getForecastCacheKey(terminal, date);

    if (!refresh) {
      const cached = forecastCache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit: ${terminal}:${date}`);
        return {
          success: true,
          data: cached,
          cachedAt: forecastCache.getTimestamp(cacheKey) || undefined,
          timestamp: new Date().toISOString(),
        };
      }
    }

    this.logger.info(`Cache miss or refresh: ${terminal}:${date}`);
    try {
      const data = await scrapeForecast(terminal, date);
      forecastCache.set(cacheKey, data, CACHE_TTL.FORECAST);

      return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch forecast: ${terminal}:${date}`, error);

      const staleData = forecastCache.getWithMeta(cacheKey);
      if (staleData) {
        return {
          success: true,
          data: staleData.data,
          cachedAt: new Date(staleData.timestamp).toISOString(),
          error: { code: 'STALE_DATA', message: 'Using cached data due to fetch error' },
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        error: { code: 'SCRAPER_ERROR', message: 'Failed to fetch forecast data' },
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const forecastService = new ForecastService();
