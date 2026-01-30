import { Terminal } from './terminal';

/**
 * 혼잡도 레벨 (공항 웹사이트 color1~4 매핑)
 */
export enum CongestionLevel {
  SMOOTH = 'SMOOTH', // color1: 원활
  NORMAL = 'NORMAL', // color2: 보통
  CONGESTED = 'CONGESTED', // color3: 혼잡
  VERY_CONGESTED = 'VERY_CONGESTED', // color4: 매우혼잡
}

/**
 * 혼잡도 레벨 메타데이터
 */
export interface CongestionLevelMeta {
  level: CongestionLevel;
  colorClass: string;
  label: string;
  labelKo: string;
  color: string;
  order: number;
}

/**
 * 혼잡도 레벨별 설정
 */
export const CONGESTION_LEVEL_META: Record<CongestionLevel, CongestionLevelMeta> = {
  [CongestionLevel.SMOOTH]: {
    level: CongestionLevel.SMOOTH,
    colorClass: 'color1',
    label: 'Smooth',
    labelKo: '원활',
    color: '#22C55E', // green-500
    order: 1,
  },
  [CongestionLevel.NORMAL]: {
    level: CongestionLevel.NORMAL,
    colorClass: 'color2',
    label: 'Normal',
    labelKo: '보통',
    color: '#EAB308', // yellow-500
    order: 2,
  },
  [CongestionLevel.CONGESTED]: {
    level: CongestionLevel.CONGESTED,
    colorClass: 'color3',
    label: 'Congested',
    labelKo: '혼잡',
    color: '#F97316', // orange-500
    order: 3,
  },
  [CongestionLevel.VERY_CONGESTED]: {
    level: CongestionLevel.VERY_CONGESTED,
    colorClass: 'color4',
    label: 'Very Congested',
    labelKo: '매우혼잡',
    color: '#EF4444', // red-500
    order: 4,
  },
};

/**
 * 출국장 게이트 정보
 */
export interface GateInfo {
  gateId: string;
  gateName: string;
  waitTimeMinutes: number | null;
  congestionLevel: CongestionLevel;
}

/**
 * 시간대별 혼잡도 예측
 */
export interface HourlyCongestion {
  hour: number;
  timeSlot: string;
  predictedCount: number;
  congestionLevel: CongestionLevel;
}

/**
 * 터미널 혼잡도 응답 데이터
 */
export interface TerminalCongestion {
  terminal: Terminal;
  timestamp: string;
  gates: GateInfo[];
  hourlyForecast: HourlyCongestion[];
  overallLevel: CongestionLevel;
  lastUpdated: string;
}

/**
 * CSS 클래스명 → 혼잡도 레벨 변환
 */
export function colorClassToLevel(colorClass: string): CongestionLevel {
  if (colorClass.includes('color1')) return CongestionLevel.SMOOTH;
  if (colorClass.includes('color2')) return CongestionLevel.NORMAL;
  if (colorClass.includes('color3')) return CongestionLevel.CONGESTED;
  if (colorClass.includes('color4')) return CongestionLevel.VERY_CONGESTED;
  return CongestionLevel.NORMAL;
}

/**
 * 대기시간(분) → 혼잡도 레벨 변환
 */
export function waitTimeToLevel(minutes: number | null): CongestionLevel {
  if (minutes === null) return CongestionLevel.NORMAL;
  if (minutes <= 10) return CongestionLevel.SMOOTH;
  if (minutes <= 20) return CongestionLevel.NORMAL;
  if (minutes <= 30) return CongestionLevel.CONGESTED;
  return CongestionLevel.VERY_CONGESTED;
}
