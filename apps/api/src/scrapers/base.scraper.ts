import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';
import { AIRPORT_BASE_URL } from '@incheon-dashboard/shared';
import { Logger } from '../utils/logger';

export interface ScraperConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  userAgent: string;
}

const DEFAULT_CONFIG: ScraperConfig = {
  baseUrl: AIRPORT_BASE_URL,
  timeout: 10000,
  retryCount: 3,
  retryDelay: 1000,
  userAgent: 'IncheonAirportDashboard/1.0 (compatible; dashboard crawler)',
};

export abstract class BaseScraper<T> {
  protected http: AxiosInstance;
  protected logger: Logger;
  protected config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = new Logger(this.constructor.name);

    this.http = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'User-Agent': this.config.userAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
      },
    });
  }

  /**
   * 페이지 HTML 가져오기 (재시도 로직 포함)
   */
  protected async fetchPage(path: string): Promise<cheerio.CheerioAPI> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        this.logger.debug(`Fetching ${path} (attempt ${attempt})`);
        const response = await this.http.get(path);
        return cheerio.load(response.data);
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`Fetch failed (attempt ${attempt}): ${lastError.message}`);

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw new ScraperError(
      `Failed to fetch ${path} after ${this.config.retryCount} attempts: ${lastError?.message}`,
      this.constructor.name
    );
  }

  /**
   * AJAX API 호출
   */
  protected async fetchApi<R>(path: string, config?: AxiosRequestConfig): Promise<R> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryCount; attempt++) {
      try {
        this.logger.debug(`API call ${path} (attempt ${attempt})`);
        const response = await this.http.get<R>(path, {
          ...config,
          headers: {
            ...config?.headers,
            'X-Requested-With': 'XMLHttpRequest',
          },
        });
        return response.data;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(`API call failed (attempt ${attempt}): ${lastError.message}`);

        if (attempt < this.config.retryCount) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw new ScraperError(
      `API call to ${path} failed after ${this.config.retryCount} attempts: ${lastError?.message}`,
      this.constructor.name
    );
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 추상 메서드: 각 스크래퍼에서 구현
   */
  abstract scrape(): Promise<T>;
}

export class ScraperError extends Error {
  constructor(
    message: string,
    public source: string
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}
