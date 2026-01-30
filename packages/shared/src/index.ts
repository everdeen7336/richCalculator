export enum Terminal {
  T1 = 'T1',
  T2 = 'T2',
}

export interface TerminalInfo {
  id: Terminal;
  name: string;
  nameKo: string;
}

export const TERMINAL_CONFIG: Record<Terminal, TerminalInfo> = {
  [Terminal.T1]: {
    id: Terminal.T1,
    name: 'Terminal 1',
    nameKo: '제1여객터미널',
  },
  [Terminal.T2]: {
    id: Terminal.T2,
    name: 'Terminal 2',
    nameKo: '제2여객터미널',
  },
};

export function isValidTerminal(value: string): value is Terminal {
  return Object.values(Terminal).includes(value as Terminal);
}

export enum CongestionLevel {
  SMOOTH = 'SMOOTH',
  NORMAL = 'NORMAL',
  CONGESTED = 'CONGESTED',
  VERY_CONGESTED = 'VERY_CONGESTED',
}

export interface CongestionLevelMeta {
  level: CongestionLevel;
  colorClass: string;
  label: string;
  labelKo: string;
  color: string;
  order: number;
}

export const CONGESTION_LEVEL_META: Record<CongestionLevel, CongestionLevelMeta> = {
  [CongestionLevel.SMOOTH]: {
    level: CongestionLevel.SMOOTH,
    colorClass: 'color1',
    label: 'Smooth',
    labelKo: '원활',
    color: '#22C55E',
    order: 1,
  },
  [CongestionLevel.NORMAL]: {
    level: CongestionLevel.NORMAL,
    colorClass: 'color2',
    label: 'Normal',
    labelKo: '보통',
    color: '#EAB308',
    order: 2,
  },
  [CongestionLevel.CONGESTED]: {
    level: CongestionLevel.CONGESTED,
    colorClass: 'color3',
    label: 'Congested',
    labelKo: '혼잡',
    color: '#F97316',
    order: 3,
  },
  [CongestionLevel.VERY_CONGESTED]: {
    level: CongestionLevel.VERY_CONGESTED,
    colorClass: 'color4',
    label: 'Very Congested',
    labelKo: '매우혼잡',
    color: '#EF4444',
    order: 4,
  },
};

export interface GateInfo {
  gateId: string;
  gateName: string;
  waitTimeMinutes: number | null;
  congestionLevel: CongestionLevel;
}

export interface HourlyCongestion {
  hour: number;
  timeSlot: string;
  predictedCount: number;
  congestionLevel: CongestionLevel;
}

export interface TerminalCongestion {
  terminal: Terminal;
  timestamp: string;
  gates: GateInfo[];
  hourlyForecast: HourlyCongestion[];
  overallLevel: CongestionLevel;
  lastUpdated: string;
}

export function colorClassToLevel(colorClass: string): CongestionLevel {
  if (colorClass.includes('color1')) return CongestionLevel.SMOOTH;
  if (colorClass.includes('color2')) return CongestionLevel.NORMAL;
  if (colorClass.includes('color3')) return CongestionLevel.CONGESTED;
  if (colorClass.includes('color4')) return CongestionLevel.VERY_CONGESTED;
  return CongestionLevel.NORMAL;
}

export function waitTimeToLevel(minutes: number | null): CongestionLevel {
  if (minutes === null) return CongestionLevel.NORMAL;
  if (minutes <= 10) return CongestionLevel.SMOOTH;
  if (minutes <= 20) return CongestionLevel.NORMAL;
  if (minutes <= 30) return CongestionLevel.CONGESTED;
  return CongestionLevel.VERY_CONGESTED;
}

export enum ParkingType {
  SHORT_TERM = 'SHORT_TERM',
  LONG_TERM = 'LONG_TERM',
}

export enum ParkingStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
  UNKNOWN = 'UNKNOWN',
}

export interface ParkingFloor {
  floorId: string;
  floorName: string;
  status: ParkingStatus;
  availableSpaces: number | null;
  rawText: string;
}

export interface ParkingTower {
  towerId: string;
  towerName: string;
  status: ParkingStatus;
  availableSpaces: number | null;
  rawText: string;
}

export interface ShortTermParking {
  terminal: Terminal;
  type: ParkingType.SHORT_TERM;
  floors: ParkingFloor[];
  totalAvailable: number;
  hasFull: boolean;
  lastUpdated: string;
}

export interface LongTermParking {
  terminal: Terminal;
  type: ParkingType.LONG_TERM;
  towers?: ParkingTower[];
  floors?: ParkingFloor[];
  totalAvailable: number;
  hasFull: boolean;
  lastUpdated: string;
  unavailable?: boolean;
}

export interface ParkingInfo {
  terminal: Terminal;
  shortTerm: ShortTermParking;
  longTerm: LongTermParking;
  timestamp: string;
  peakHoursWarning: boolean;
}

export interface ParkingStatusMeta {
  status: ParkingStatus;
  label: string;
  labelKo: string;
  color: string;
}

export const PARKING_STATUS_META: Record<ParkingStatus, ParkingStatusMeta> = {
  [ParkingStatus.AVAILABLE]: {
    status: ParkingStatus.AVAILABLE,
    label: 'Available',
    labelKo: '주차가능',
    color: '#22C55E',
  },
  [ParkingStatus.FULL]: {
    status: ParkingStatus.FULL,
    label: 'Full',
    labelKo: '만차',
    color: '#EF4444',
  },
  [ParkingStatus.UNKNOWN]: {
    status: ParkingStatus.UNKNOWN,
    label: 'Unknown',
    labelKo: '정보없음',
    color: '#9CA3AF',
  },
};

export interface ParsedAvailability {
  status: ParkingStatus;
  spaces: number | null;
}

export function parseAvailabilityText(text: string): ParsedAvailability {
  const trimmed = text.trim();

  if (trimmed.includes('만차')) {
    return { status: ParkingStatus.FULL, spaces: null };
  }

  const match = trimmed.match(/(\d+)대\s*가능/);
  if (match) {
    return {
      status: ParkingStatus.AVAILABLE,
      spaces: parseInt(match[1], 10),
    };
  }

  return { status: ParkingStatus.UNKNOWN, spaces: null };
}

export function isPeakHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 19);
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error?: ApiError;
  cachedAt?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export type CongestionApiResponse = ApiResponse<TerminalCongestion>;
export type ParkingApiResponse = ApiResponse<ParkingInfo>;

export interface DashboardData {
  congestion: TerminalCongestion;
  parking: ParkingInfo;
}

export type DashboardApiResponse = ApiResponse<DashboardData>;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SCRAPER_ERROR: 'SCRAPER_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const CACHE_TTL = {
  PARKING: 30 * 1000,
  CONGESTION: 60 * 1000,
  FORECAST: 10 * 60 * 1000,
} as const;

export const AIRPORT_BASE_URL = process.env.AIRPORT_BASE_URL ?? '';

export const PARKING_URLS: Record<Terminal, Record<ParkingType, string | null>> = {
  [Terminal.T1]: {
    [ParkingType.SHORT_TERM]: process.env.PARKING_T1_SHORT_TERM_URL ?? '',
    [ParkingType.LONG_TERM]: process.env.PARKING_T1_LONG_TERM_URL ?? '',
  },
  [Terminal.T2]: {
    [ParkingType.SHORT_TERM]: process.env.PARKING_T2_SHORT_TERM_URL ?? '',
    [ParkingType.LONG_TERM]: process.env.PARKING_T2_LONG_TERM_URL ?? '',
  },
};

export const CONGESTION_URLS = {
  API: process.env.CONGESTION_API_URL ?? '',
  PAGE: process.env.CONGESTION_PAGE_URL ?? '',
} as const;

// Forecast URLs
export const FORECAST_URLS = {
  INOUT_EXCEL: process.env.CONGESTION_INOUT_EXCEL_URL ?? '/pni/ap_ko/statisticPredictCrowdedOfInoutExcel.do',
  ROUTE_HTML: process.env.CONGESTION_ROUTE_URL ?? '/pni/ap_ko/statisticPredictCrowdedOfRoute.do',
} as const;

export const FORECAST_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// 출입국별 시간대 데이터
export interface HourlyInOutData {
  hour: number;
  timeSlot: string;
  departure: {
    gate1: number;
    gate2: number;
    gate3: number;
    gate4: number;
    gate56: number;
    total: number;
  };
  arrival: {
    ab: number;
    c: number;
    d: number;
    ef: number;
    total: number;
  };
}

// 노선별 시간대 데이터
export interface HourlyRouteData {
  hour: number;
  timeSlot: string;
  japan: number;
  china: number;
  southeastAsia: number;
  northAmerica: number;
  europe: number;
  oceania: number;
  other: number;
}

// 혼잡도 예측 전체 데이터
export interface CongestionForecast {
  terminal: Terminal;
  date: string; // YYYYMMDD
  inOutData: HourlyInOutData[];
  routeData: HourlyRouteData[];
  summary: {
    totalDeparture: number;
    totalArrival: number;
    peakDepartureHour: number;
    peakDepartureCount: number;
    peakArrivalHour: number;
    peakArrivalCount: number;
  };
  lastUpdated: string;
}

export type CongestionForecastApiResponse = ApiResponse<CongestionForecast>;
