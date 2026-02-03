/**
 * Google Analytics 4 이벤트 트래킹 헬퍼
 *
 * 배포 가설 검증용 이벤트 (CLAUDE.md 섹션 4):
 * - flight_registered:   항공편 등록 (가설 2 — 전환율)
 * - cta_clicked:         프리미엄 CTA 클릭 (가설 3 — CTR)
 * - share_clicked:       공유 버튼 클릭 (가설 4 — 바이럴)
 * - accommodation_added: 숙소 등록
 * - itinerary_added:     장소 추가
 * - expense_added:       지출 기록
 * - checklist_toggled:   체크리스트 항목 체크
 * - phase_switched:      planning ↔ traveling 전환
 * - feedback_sent:       문의/피드백 전송
 * - nudge_cta_clicked:   NudgeBar CTA 클릭 (단계별)
 */

type GTagEvent = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent({ action, category, label, value }: GTagEvent): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
}

// ── 사전 정의 이벤트 ──

export const GA = {
  /** 항공편 등록 (가설 2) */
  flightRegistered: (source: 'api' | 'manual', flightNumber: string) =>
    trackEvent({ action: 'flight_registered', category: 'engagement', label: `${source}:${flightNumber}` }),

  /** 귀국편 등록 */
  returnFlightRegistered: (source: 'api' | 'manual') =>
    trackEvent({ action: 'return_flight_registered', category: 'engagement', label: source }),

  /** 프리미엄 CTA 클릭 (가설 3) */
  ctaClicked: (widget: string, ctaText: string) =>
    trackEvent({ action: 'cta_clicked', category: 'monetization', label: `${widget}:${ctaText}` }),

  /** 공유 버튼 클릭 (가설 4) */
  shareClicked: (method: 'native' | 'clipboard') =>
    trackEvent({ action: 'share_clicked', category: 'growth', label: method }),

  /** 숙소 등록 */
  accommodationAdded: () =>
    trackEvent({ action: 'accommodation_added', category: 'engagement' }),

  /** 장소 추가 */
  itineraryAdded: (placeName: string) =>
    trackEvent({ action: 'itinerary_added', category: 'engagement', label: placeName }),

  /** 지출 기록 */
  expenseAdded: (categoryLabel: string, amount: number) =>
    trackEvent({ action: 'expense_added', category: 'engagement', label: categoryLabel, value: amount }),

  /** 체크리스트 체크 */
  checklistToggled: (itemLabel: string) =>
    trackEvent({ action: 'checklist_toggled', category: 'engagement', label: itemLabel }),

  /** phase 전환 */
  phaseSwitched: (to: 'planning' | 'traveling') =>
    trackEvent({ action: 'phase_switched', category: 'engagement', label: to }),

  /** 피드백 전송 */
  feedbackSent: (feedbackType: string) =>
    trackEvent({ action: 'feedback_sent', category: 'feedback', label: feedbackType }),

  /** NudgeBar CTA 클릭 */
  nudgeCtaClicked: (stage: string, ctaLabel: string) =>
    trackEvent({ action: 'nudge_cta_clicked', category: 'engagement', label: `${stage}:${ctaLabel}` }),

  /** 외부 딥링크 클릭 */
  externalLinkClicked: (service: string) =>
    trackEvent({ action: 'external_link_clicked', category: 'referral', label: service }),

  // ── /air 페이지 이벤트 ──

  /** /air 허브 페이지 진입 */
  airHubViewed: () =>
    trackEvent({ action: 'air_hub_viewed', category: 'air_guide' }),

  /** 출국/입국 카드 클릭 */
  airJourneySelected: (journey: 'departure' | 'arrival') =>
    trackEvent({ action: 'air_journey_selected', category: 'air_guide', label: journey }),

  /** 터미널 선택 */
  airTerminalSelected: (terminal: 'T1' | 'T2', page: 'departure' | 'arrival') =>
    trackEvent({ action: 'air_terminal_selected', category: 'air_guide', label: `${page}:${terminal}` }),

  /** 날짜 변경 */
  airDateChanged: (page: 'departure' | 'arrival') =>
    trackEvent({ action: 'air_date_changed', category: 'air_guide', label: page }),

  /** 주차 새로고침 클릭 */
  airParkingRefreshed: (terminal: 'T1' | 'T2') =>
    trackEvent({ action: 'air_parking_refreshed', category: 'air_guide', label: terminal }),

  /** 페이지 체류 (스크롤 깊이 또는 시간 기반) */
  airPageEngaged: (page: 'hub' | 'departure' | 'arrival', engagementType: 'scroll_50' | 'scroll_100' | 'time_30s' | 'time_60s') =>
    trackEvent({ action: 'air_page_engaged', category: 'air_guide', label: `${page}:${engagementType}` }),
};
