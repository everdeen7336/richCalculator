import { Terminal } from './terminal';

/**
 * 주차장 유형
 */
export enum ParkingType {
  SHORT_TERM = 'SHORT_TERM', // 단기주차장
  LONG_TERM = 'LONG_TERM', // 장기주차장
}

/**
 * 주차 가능 상태
 */
export enum ParkingStatus {
  AVAILABLE = 'AVAILABLE', // 주차 가능 ("XXX대 가능")
  FULL = 'FULL', // 만차
  UNKNOWN = 'UNKNOWN', // 정보 없음
}

/**
 * 주차장 층/구역 정보
 */
export interface ParkingFloor {
  floorId: string; // B1, B2, 1F, 2F 등
  floorName: string; // "지하 1층", "지상 2층" 등
  status: ParkingStatus;
  availableSpaces: number | null; // 만차일 경우 null
  rawText: string; // 원본 텍스트
}

/**
 * 장기주차장 타워 정보 (T1용)
 */
export interface ParkingTower {
  towerId: string; // P1, P2, LONG
  towerName: string;
  status: ParkingStatus;
  availableSpaces: number | null;
  rawText: string;
}

/**
 * 단기주차장 정보
 */
export interface ShortTermParking {
  terminal: Terminal;
  type: ParkingType.SHORT_TERM;
  floors: ParkingFloor[];
  totalAvailable: number;
  hasFull: boolean;
  lastUpdated: string;
}

/**
 * 장기주차장 정보
 */
export interface LongTermParking {
  terminal: Terminal;
  type: ParkingType.LONG_TERM;
  towers?: ParkingTower[]; // T1
  floors?: ParkingFloor[];
  totalAvailable: number;
  hasFull: boolean;
  lastUpdated: string;
  unavailable?: boolean; // T2는 장기주차장 실시간 현황 미제공
}

/**
 * 통합 주차장 정보
 */
export interface ParkingInfo {
  terminal: Terminal;
  shortTerm: ShortTermParking;
  longTerm: LongTermParking;
  timestamp: string;
  peakHoursWarning: boolean;
}

/**
 * 주차장 상태 메타데이터
 */
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

/**
 * 텍스트 파싱 결과
 */
export interface ParsedAvailability {
  status: ParkingStatus;
  spaces: number | null;
}

/**
 * 주차 가능 텍스트 파싱
 * "179대 가능" → { status: AVAILABLE, spaces: 179 }
 * "만차" → { status: FULL, spaces: null }
 */
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

/**
 * 혼잡 시간대 확인 (05:00-08:00, 16:00-19:00)
 */
export function isPeakHours(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return (hour >= 5 && hour <= 8) || (hour >= 16 && hour <= 19);
}
