/**
 * 여정 단계 (User Journey Phase)
 */
export type JourneyPhase = 'preparing' | 'coordinating' | 'onsite' | 'recording';

/**
 * 장소 정보
 */
export interface Place {
  id: string;
  name: string;
  category?: string;
  quietHours?: string;
  moodKeyword?: string;
  estimatedMinutes?: number;
  address?: string;
}

/**
 * 여정 아이템 (일정 내 한 항목)
 */
export interface JourneyItem {
  id: string;
  place: Place;
  order: number;
  visitedAt?: string;
  durationMinutes?: number;
  memo?: string;
}

/**
 * 예산 카테고리
 */
export interface BudgetCategory {
  id: string;
  label: string;
  planned: number;
  spent: number;
}

/**
 * 지출 기록
 */
export interface Expense {
  id: string;
  categoryId: string;
  amount: number;
  memo: string;
  createdAt: string;
}

/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  time: string;
  label: string;
  done: boolean;
}

/**
 * 방문 기록 (Recording 단계용)
 */
export interface VisitRecord {
  itemId: string;
  placeName: string;
  arrivedAt: string;
  leftAt?: string;
  durationMinutes: number;
  memo?: string;
}

/**
 * 여정 전체 상태
 */
export interface JourneyState {
  phase: JourneyPhase;
  items: JourneyItem[];
  budget: BudgetCategory[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  visitRecords: VisitRecord[];
  totalBudget: number;
  departureDate?: string;
  destination?: string;
}

/**
 * Context-Aware 카드 타입
 */
export type ContextCardType = 'moving' | 'dining' | 'evening' | 'idle';

/**
 * 시간대 기반 카드 타입 결정
 */
export function getContextCardType(hour: number): ContextCardType {
  if (hour >= 7 && hour <= 9) return 'moving';
  if (hour >= 11 && hour <= 13) return 'dining';
  if (hour >= 17 && hour <= 19) return 'dining';
  if (hour >= 20 || hour <= 5) return 'evening';
  return 'moving';
}

/**
 * 기본 출국 체크리스트
 */
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 'c1', time: '3시간 전', label: '공항 도착', done: false },
  { id: 'c2', time: '2.5시간 전', label: '체크인 & 수화물', done: false },
  { id: 'c3', time: '2시간 전', label: '보안 검색', done: false },
  { id: 'c4', time: '1.5시간 전', label: '출국 심사', done: false },
  { id: 'c5', time: '1시간 전', label: '면세 쇼핑', done: false },
  { id: 'c6', time: '30분 전', label: '탑승구 이동', done: false },
];
