import { TerminalCongestion } from './congestion';
import { ParkingInfo } from './parking';

/**
 * API 응답 공통 구조
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: ApiError;
  cachedAt?: string;
  timestamp: string;
}

/**
 * API 에러 구조
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 혼잡도 API 응답
 */
export type CongestionApiResponse = ApiResponse<TerminalCongestion>;

/**
 * 주차장 API 응답
 */
export type ParkingApiResponse = ApiResponse<ParkingInfo>;

/**
 * 대시보드 통합 데이터
 */
export interface DashboardData {
  congestion: TerminalCongestion;
  parking: ParkingInfo;
}

/**
 * 대시보드 API 응답
 */
export type DashboardApiResponse = ApiResponse<DashboardData>;

/**
 * 에러 코드 상수
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCRAPER_ERROR: 'SCRAPER_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * 폴링 간격 상수
 */
export const POLLING_INTERVAL = {
  DEFAULT: 30 * 1000, // 30초
  FAST: 10 * 1000, // 10초
  SLOW: 60 * 1000, // 60초
} as const;
