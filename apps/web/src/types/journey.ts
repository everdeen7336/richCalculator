/**
 * 여정 단계 (User Journey Phase)
 */
export type JourneyPhase = 'planning' | 'traveling';

/** 이전 4-phase → 2-phase 마이그레이션 */
export function migratePhase(old: string): JourneyPhase {
  if (old === 'traveling') return 'traveling';
  if (old === 'coordinating' || old === 'onsite' || old === 'recording') return 'traveling';
  return 'planning';
}

/** 체크리스트 카테고리 */
export type ChecklistCategory = 'preparation' | 'departure' | 'arrival';

/** 준비물 서브카테고리 (preparation 내 세분화) */
export type PackingCategory =
  | 'documents'      // 서류: 여권, 비자, 신분증
  | 'finance'        // 금융: 환전, 카드
  | 'communication'  // 통신: eSIM, 로밍
  | 'clothing'       // 의류: 옷, 신발
  | 'toiletries'     // 세면: 세면도구, 화장품
  | 'electronics'    // 전자기기: 충전기, 어댑터
  | 'medical'        // 의약품: 상비약
  | 'booking';       // 예약: 항공, 숙소, 보험

export const PACKING_CATEGORY_META: Record<PackingCategory, { icon: string; label: string; order: number }> = {
  documents:     { icon: '📄', label: '서류', order: 0 },
  booking:       { icon: '📋', label: '예약', order: 1 },
  finance:       { icon: '💳', label: '금융', order: 2 },
  communication: { icon: '📱', label: '통신', order: 3 },
  clothing:      { icon: '👕', label: '의류', order: 4 },
  toiletries:    { icon: '🧴', label: '세면', order: 5 },
  electronics:   { icon: '🔌', label: '전자기기', order: 6 },
  medical:       { icon: '💊', label: '의약품', order: 7 },
};

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
  /** 수동 DAY 할당 (1부터 시작, 미지정 시 자동 분배) */
  day?: number;
  /** 예상 방문 시작 시각 (HH:MM) */
  startTime?: string;
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
  /** 원화 환산 금액 (currency !== 'KRW'일 때) */
  convertedAmount?: number;
  /** 지출 통화 (기본 KRW) */
  currency?: string;
}

/** 주요 여행 통화 */
export const TRAVEL_CURRENCIES = [
  { code: 'KRW', symbol: '₩', label: '원' },
  { code: 'USD', symbol: '$', label: '달러' },
  { code: 'JPY', symbol: '¥', label: '엔' },
  { code: 'EUR', symbol: '€', label: '유로' },
  { code: 'CNY', symbol: '¥', label: '위안' },
  { code: 'THB', symbol: '฿', label: '바트' },
  { code: 'VND', symbol: '₫', label: '동' },
  { code: 'SGD', symbol: 'S$', label: '싱달러' },
  { code: 'TWD', symbol: 'NT$', label: '대만달러' },
  { code: 'PHP', symbol: '₱', label: '페소' },
  { code: 'MYR', symbol: 'RM', label: '링깃' },
  { code: 'IDR', symbol: 'Rp', label: '루피아' },
  { code: 'AUD', symbol: 'A$', label: '호주달러' },
  { code: 'GBP', symbol: '£', label: '파운드' },
  { code: 'AED', symbol: 'د.إ', label: '디르함' },
  { code: 'HKD', symbol: 'HK$', label: '홍콩달러' },
] as const;

/**
 * 체크리스트 항목
 */
export interface ChecklistItem {
  id: string;
  time: string;
  label: string;
  done: boolean;
  category?: ChecklistCategory;
  /** 준비물 서브카테고리 (category === 'preparation' 일 때만 사용) */
  packingCategory?: PackingCategory;
  /** 필수 항목 여부 */
  essential?: boolean;
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
 * 비행편 정보
 */
export interface FlightInfo {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    scheduledTime: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    city: string;
    scheduledTime: string;
    terminal?: string;
  };
  status: FlightStatus;
  durationMinutes: number;
  source: 'api' | 'simulated' | 'manual';
}

export type FlightStatus =
  | 'scheduled' | 'boarding' | 'departed' | 'in_air'
  | 'landed' | 'arrived' | 'delayed' | 'cancelled';

export const FLIGHT_STATUS_LABEL: Record<FlightStatus, string> = {
  scheduled: '예정',
  boarding: '탑승 중',
  departed: '출발',
  in_air: '비행 중',
  landed: '착륙',
  arrived: '도착',
  delayed: '지연',
  cancelled: '취소',
};

/** 비행편 기준 출국 체크리스트 (실제 시각 포함) */
export function generateFlightChecklist(departureTime: string): ChecklistItem[] {
  const dep = new Date(departureTime);
  const fmt = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const steps = [
    { m: -180, label: '공항 도착' },
    { m: -150, label: '체크인 & 수화물' },
    { m: -120, label: '보안 검색' },
    { m: -90,  label: '출국 심사' },
    { m: -60,  label: '면세 쇼핑' },
    { m: -40,  label: '탑승구 이동' },
    { m: -30,  label: '탑승 시작' },
    { m: 0,    label: '이륙 🛫' },
  ];
  return steps.map((s, i) => ({
    id: `fl-${i}`,
    time: fmt(new Date(dep.getTime() + s.m * 60000)),
    label: s.label,
    done: false,
    category: 'departure' as ChecklistCategory,
  }));
}

/** 비행편 기준 입국 체크리스트 */
export function generateArrivalChecklist(arrivalTime: string): ChecklistItem[] {
  const arr = new Date(arrivalTime);
  const fmt = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const steps = [
    { m: 0,   label: '착륙 🛬' },
    { m: 15,  label: '입국 심사' },
    { m: 35,  label: '수화물 수취' },
    { m: 50,  label: '세관 검사' },
    { m: 60,  label: '입국장 도착' },
  ];
  return steps.map((s, i) => ({
    id: `ar-${i}`,
    time: fmt(new Date(arr.getTime() + s.m * 60000)),
    label: s.label,
    done: false,
    category: 'arrival' as ChecklistCategory,
  }));
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
  departureFlight?: FlightInfo;
  returnFlight?: FlightInfo;
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

/** 여행 준비 체크리스트 (planning phase) — 카테고리별 세분화 */
export const PREPARATION_CHECKLIST: ChecklistItem[] = [
  // 📄 서류 (documents)
  { id: 'doc-1', time: '', label: '여권 유효기간 확인 (6개월 이상)', done: false, category: 'preparation', packingCategory: 'documents', essential: true },
  { id: 'doc-2', time: '', label: '여권 사본/사진 저장', done: false, category: 'preparation', packingCategory: 'documents', essential: true },
  { id: 'doc-3', time: '', label: '비자 필요 여부 확인', done: false, category: 'preparation', packingCategory: 'documents', essential: false },

  // 📋 예약 (booking)
  { id: 'book-1', time: '', label: '항공편 예약', done: false, category: 'preparation', packingCategory: 'booking', essential: true },
  { id: 'book-2', time: '', label: '숙소 예약', done: false, category: 'preparation', packingCategory: 'booking', essential: true },
  { id: 'book-3', time: '', label: '여행자 보험 가입', done: false, category: 'preparation', packingCategory: 'booking', essential: true },

  // 💳 금융 (finance)
  { id: 'fin-1', time: '', label: '환전하기', done: false, category: 'preparation', packingCategory: 'finance', essential: true },
  { id: 'fin-2', time: '', label: '해외결제 카드 준비', done: false, category: 'preparation', packingCategory: 'finance', essential: true },
  { id: 'fin-3', time: '', label: '카드사 해외이용 설정', done: false, category: 'preparation', packingCategory: 'finance', essential: false },

  // 📱 통신 (communication)
  { id: 'comm-1', time: '', label: 'eSIM/유심 구매', done: false, category: 'preparation', packingCategory: 'communication', essential: true },
  { id: 'comm-2', time: '', label: '필수 앱 다운로드 (지도, 번역)', done: false, category: 'preparation', packingCategory: 'communication', essential: false },

  // 👕 의류 (clothing)
  { id: 'cloth-1', time: '', label: '현지 날씨 확인', done: false, category: 'preparation', packingCategory: 'clothing', essential: true },
  { id: 'cloth-2', time: '', label: '의류 챙기기', done: false, category: 'preparation', packingCategory: 'clothing', essential: true },
  { id: 'cloth-3', time: '', label: '편한 신발', done: false, category: 'preparation', packingCategory: 'clothing', essential: true },

  // 🧴 세면 (toiletries)
  { id: 'toil-1', time: '', label: '세면도구 (100ml 이하)', done: false, category: 'preparation', packingCategory: 'toiletries', essential: true },
  { id: 'toil-2', time: '', label: '선크림/화장품', done: false, category: 'preparation', packingCategory: 'toiletries', essential: false },

  // 🔌 전자기기 (electronics)
  { id: 'elec-1', time: '', label: '충전기/케이블', done: false, category: 'preparation', packingCategory: 'electronics', essential: true },
  { id: 'elec-2', time: '', label: '여행용 어댑터', done: false, category: 'preparation', packingCategory: 'electronics', essential: true },
  { id: 'elec-3', time: '', label: '보조배터리', done: false, category: 'preparation', packingCategory: 'electronics', essential: false },

  // 💊 의약품 (medical)
  { id: 'med-1', time: '', label: '상비약 (두통약, 소화제)', done: false, category: 'preparation', packingCategory: 'medical', essential: true },
  { id: 'med-2', time: '', label: '개인 처방약', done: false, category: 'preparation', packingCategory: 'medical', essential: false },
];

/** 공항 수속 체크리스트 (traveling phase — 출국) */
export const DEPARTURE_CHECKLIST: ChecklistItem[] = [
  { id: 'c1', time: '3시간 전', label: '공항 도착', done: false, category: 'departure' },
  { id: 'c2', time: '2.5시간 전', label: '체크인 & 수화물', done: false, category: 'departure' },
  { id: 'c3', time: '2시간 전', label: '보안 검색', done: false, category: 'departure' },
  { id: 'c4', time: '1.5시간 전', label: '출국 심사', done: false, category: 'departure' },
  { id: 'c5', time: '1시간 전', label: '면세 쇼핑', done: false, category: 'departure' },
  { id: 'c6', time: '30분 전', label: '탑승구 이동', done: false, category: 'departure' },
];

/** 하위호환용 기본 체크리스트 */
export const DEFAULT_CHECKLIST: ChecklistItem[] = PREPARATION_CHECKLIST;

/**
 * 숙소 정보
 */
export type AccommodationType = 'hotel' | 'airbnb' | 'hostel' | 'guesthouse' | 'other';

export interface Accommodation {
  id: string;
  name: string;
  type: AccommodationType;
  checkIn: string;   // ISO date
  checkOut: string;  // ISO date
  address?: string;
  confirmationCode?: string;
  cost?: number;
  currency?: string;
  memo?: string;
  booked: boolean;
}

export const ACCOMMODATION_TYPE_LABEL: Record<AccommodationType, string> = {
  hotel: '호텔',
  airbnb: '에어비앤비',
  hostel: '호스텔',
  guesthouse: '게스트하우스',
  other: '기타',
};

/**
 * 여정 단계 (8-step Journey Stage) — 자동 계산
 */
export type JourneyStage =
  | 'dreaming'       // S1: 목적지/날짜 미정
  | 'flight'         // S2: 항공권 미등록
  | 'accommodation'  // S3: 숙소 미등록
  | 'itinerary'      // S4: 일정 부족
  | 'packing'        // S5: 준비물 미완료
  | 'departure'      // S6: 출국 당일
  | 'ontrip'         // S7: 현지 여행 중
  | 'return';        // S8: 귀국

export const STAGE_META: Record<JourneyStage, { icon: string; label: string; order: number }> = {
  dreaming:      { icon: '💭', label: '여행 결심', order: 0 },
  flight:        { icon: '✈️', label: '항공권', order: 1 },
  accommodation: { icon: '🏨', label: '숙소', order: 2 },
  itinerary:     { icon: '📍', label: '일정', order: 3 },
  packing:       { icon: '🧳', label: '준비물', order: 4 },
  departure:     { icon: '🛫', label: '출국', order: 5 },
  ontrip:        { icon: '🌍', label: '여행 중', order: 6 },
  return:        { icon: '🏠', label: '귀국', order: 7 },
};

/** 외부 서비스 딥링크 */
export function getDeepLinks(destination: string, departureDate: string, returnDate?: string) {
  const dest = encodeURIComponent(destination);
  const dep = departureDate;
  const ret = returnDate || '';
  return {
    skyscanner: `https://www.skyscanner.co.kr/transport/flights/ICN/${dest}/${dep}/`,
    naverFlight: `https://flight.naver.com/flights/international/${dep}?adult=1&isDirect=true&fareType=Y`,
    booking: `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${dep}&checkout=${ret}`,
    airbnb: `https://www.airbnb.co.kr/s/${dest}/homes?checkin=${dep}&checkout=${ret}`,
    googleMap: `https://www.google.com/maps/search/${dest}`,
    tripadvisor: `https://www.tripadvisor.co.kr/Search?q=${dest}`,
  };
}
