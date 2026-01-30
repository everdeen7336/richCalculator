import { CACHE_TTL, Terminal, ParkingInfo, TerminalCongestion, CongestionForecast } from '@incheon-dashboard/shared';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class MemoryCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTtl: number;

  constructor(defaultTtl: number = 60000) {
    this.defaultTtl = defaultTtl;
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const actualTtl = ttl ?? this.defaultTtl;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + actualTtl,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  getWithMeta(key: string): { data: T; timestamp: number } | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // 만료되어도 메타 정보와 함께 반환 (fallback용)
    return { data: entry.data, timestamp: entry.timestamp };
  }

  getTimestamp(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return new Date(entry.timestamp).toISOString();
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }
}

// 전역 캐시 인스턴스
export const parkingCache = new MemoryCache<ParkingInfo>(CACHE_TTL.PARKING);
export const congestionCache = new MemoryCache<TerminalCongestion>(CACHE_TTL.CONGESTION);

// 캐시 키 생성 헬퍼
export function getParkingCacheKey(terminal: Terminal): string {
  return `parking:${terminal}`;
}

export function getCongestionCacheKey(terminal: Terminal): string {
  return `congestion:${terminal}`;
}

export const forecastCache = new MemoryCache<CongestionForecast>(CACHE_TTL.FORECAST);

export function getForecastCacheKey(terminal: Terminal, date: string): string {
  return `forecast:${terminal}:${date}`;
}
