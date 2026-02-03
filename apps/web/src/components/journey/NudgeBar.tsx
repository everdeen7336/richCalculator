'use client';

import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { JourneyStage } from '@/types/journey';
import { STAGE_META } from '@/types/journey';

/** 외부 딥링크 빌더 */
type DeepLinkBuilder = (dest: string, depDate: string, retDate: string) => string;

interface ExternalLink {
  label: string;
  baseUrl: string;
  buildUrl: DeepLinkBuilder;
}

const EXT: Record<string, ExternalLink> = {
  skyscanner: {
    label: '스카이스캐너에서 항공권 검색',
    baseUrl: 'https://www.skyscanner.co.kr',
    buildUrl: (dest, dep) =>
      `https://www.skyscanner.co.kr/transport/flights/ICN/${encodeURIComponent(dest)}/${dep.replace(/-/g, '')}/?adultsv2=1`,
  },
  skyscannerShort: {
    label: '스카이스캐너',
    baseUrl: 'https://www.skyscanner.co.kr',
    buildUrl: (dest, dep) =>
      `https://www.skyscanner.co.kr/transport/flights/ICN/${encodeURIComponent(dest)}/${dep.replace(/-/g, '')}/?adultsv2=1`,
  },
  booking: {
    label: 'Booking.com',
    baseUrl: 'https://www.booking.com',
    buildUrl: (dest, dep, ret) => {
      const params = new URLSearchParams({ ss: dest });
      if (dep) params.set('checkin', dep);
      if (ret) params.set('checkout', ret);
      return `https://www.booking.com/searchresults.html?${params.toString()}`;
    },
  },
  airbnb: {
    label: '에어비앤비',
    baseUrl: 'https://www.airbnb.co.kr',
    buildUrl: (dest, dep, ret) => {
      const params = new URLSearchParams({ query: dest });
      if (dep) params.set('checkin', dep);
      if (ret) params.set('checkout', ret);
      return `https://www.airbnb.co.kr/s/${encodeURIComponent(dest)}/homes?${params.toString()}`;
    },
  },
};

/** 여정 단계별 넛지 정의 */
interface NudgeConfig {
  stage: JourneyStage;
  completedMessage: string;
  nextMessage: string;
  ctaLabel: string;
  ctaAction: string; // scroll target id or action key
  extKeys?: (keyof typeof EXT)[];
}

const NUDGE_MAP: NudgeConfig[] = [
  {
    stage: 'dreaming',
    completedMessage: '',
    nextMessage: '출발 날짜와 편명을 입력하면 여행이 시작돼요 ✈️',
    ctaLabel: '시작하기',
    ctaAction: '#flight-card',
    extKeys: ['skyscanner'],
  },
  {
    stage: 'flight',
    completedMessage: '출발 일정이 정해졌어요!',
    nextMessage: '편명을 등록하면 실시간 추적이 시작돼요',
    ctaLabel: '편명 등록',
    ctaAction: '#flight-card',
    extKeys: ['skyscannerShort'],
  },
  {
    stage: 'accommodation',
    completedMessage: '항공편 등록 완료!',
    nextMessage: '다음은 숙소를 정해볼까요?',
    ctaLabel: '숙소 등록',
    ctaAction: '#accommodation-card',
    extKeys: ['booking', 'airbnb'],
  },
  {
    stage: 'itinerary',
    completedMessage: '숙소 확정!',
    nextMessage: '가고 싶은 장소를 추가해보세요',
    ctaLabel: '장소 추가',
    ctaAction: '#itinerary-widget',
  },
  {
    stage: 'packing',
    completedMessage: '일정이 완성되었어요!',
    nextMessage: '출발 전 준비물을 확인하세요',
    ctaLabel: '체크리스트 보기',
    ctaAction: '#schedule-widget',
  },
  {
    stage: 'departure',
    completedMessage: '준비 완료!',
    nextMessage: '',
    ctaLabel: '여행 모드로 전환',
    ctaAction: 'switch-traveling',
  },
  {
    stage: 'ontrip',
    completedMessage: '즐거운 여행 되세요!',
    nextMessage: '',
    ctaLabel: '오늘 일정 보기',
    ctaAction: '#itinerary-widget',
  },
  {
    stage: 'return',
    completedMessage: '여행 수고하셨어요!',
    nextMessage: '경비를 정리해볼까요?',
    ctaLabel: '정산하기',
    ctaAction: '#budget-widget',
  },
];

/** 현재 여정 단계 자동 감지 */
function useCurrentStage(): { stage: JourneyStage; completedStages: JourneyStage[]; percent: number } {
  const {
    destination, departureDate, departureFlight, returnFlight,
    accommodations, items, checklist, phase,
  } = useJourneyStore();

  return useMemo(() => {
    const now = new Date();
    const depTime = departureFlight?.departure?.scheduledTime;
    const retTime = returnFlight?.arrival?.scheduledTime;
    const isAfterDeparture = depTime ? now > new Date(depTime) : false;
    const isAfterReturn = retTime ? now > new Date(retTime) : false;

    const prepItems = checklist.filter((c) => c.category === 'preparation' || !c.category);
    const prepDone = prepItems.length > 0 && prepItems.every((c) => c.done);

    // 여행 일수 계산 (최소 1일)
    const tripDays = (depTime && retTime)
      ? Math.max(1, Math.ceil((new Date(retTime).getTime() - new Date(depTime).getTime()) / 86400000))
      : 3;

    // 일정 충족 기준: 하루 최소 1곳 이상 (너무 빡빡하지 않게)
    const itineraryThreshold = Math.max(1, tripDays);

    const completed: JourneyStage[] = [];
    let current: JourneyStage = 'dreaming';

    // S1 — 항공편이 있으면 목적지/날짜는 자동 충족
    const hasDest = !!(destination || departureFlight?.arrival?.city);
    const hasDate = !!(departureDate || depTime);
    if (hasDest && hasDate) {
      completed.push('dreaming');
      current = 'flight';
    }

    // S2
    if (departureFlight) {
      if (!completed.includes('dreaming')) completed.push('dreaming');
      completed.push('flight');
      current = 'accommodation';
    }

    // S3
    if (accommodations.length > 0) {
      completed.push('accommodation');
      current = 'itinerary';
    }

    // S4
    if (items.length >= itineraryThreshold) {
      completed.push('itinerary');
      current = 'packing';
    }

    // S5
    if (prepDone) {
      completed.push('packing');
      current = 'departure';
    }

    // S6 → S7 (시간 기반 자동 전환)
    if (isAfterDeparture && !isAfterReturn) {
      completed.push('departure');
      current = 'ontrip';
    }

    // S7 → S8
    if (isAfterReturn) {
      completed.push('ontrip');
      current = 'return';
    }

    const totalStages = 8;
    const percent = Math.round((completed.length / totalStages) * 100);

    return { stage: current, completedStages: completed, percent };
  }, [destination, departureDate, departureFlight, returnFlight, accommodations, items, checklist, phase]);
}

export default function NudgeBar() {
  const { stage, completedStages, percent } = useCurrentStage();
  const { setPhase, destination, departureDate, departureFlight: depFlight, returnFlight: retFlight } = useJourneyStore();

  const nudge = NUDGE_MAP.find((n) => n.stage === stage);
  if (!nudge) return null;

  const effectiveDate = departureDate || depFlight?.departure?.scheduledTime?.slice(0, 10) || '';
  const returnDate = retFlight?.arrival?.scheduledTime?.slice(0, 10) || '';

  const dDayText = useMemo(() => {
    if (!effectiveDate) return '';
    const ts = new Date(effectiveDate + 'T00:00:00').getTime();
    if (isNaN(ts)) return '';
    const diff = Math.ceil((ts - Date.now()) / 86400000);
    if (diff < 0) return '';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  }, [effectiveDate]);

  const handleCta = () => {
    GA.nudgeCtaClicked(stage, nudge.ctaLabel);
    if (nudge.ctaAction === 'switch-traveling') {
      setPhase('traveling');
      GA.phaseSwitched('traveling');
      return;
    }
    const el = document.querySelector(nudge.ctaAction);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const allStages: JourneyStage[] = ['dreaming', 'flight', 'accommodation', 'itinerary', 'packing', 'departure', 'ontrip', 'return'];

  return (
    <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-br from-[var(--bg-card)] to-[#F5F3EE] border border-[var(--border-light)] p-4 shadow-sm fade-in-up">
      {/* 상단: 프로그레스 바 + D-day */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1 mr-3">
          <div className="flex gap-[3px]">
            {allStages.map((s) => {
              const meta = STAGE_META[s];
              const done = completedStages.includes(s);
              const active = s === stage;
              return (
                <div
                  key={s}
                  title={meta.label}
                  className="flex flex-col items-center gap-0.5"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      done
                        ? 'w-5 bg-[var(--accent)]'
                        : active
                          ? 'w-5 bg-[var(--accent)]/40'
                          : 'w-3 bg-[var(--border)]'
                    }`}
                  />
                </div>
              );
            })}
          </div>
          <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">{percent}%</span>
        </div>
        {dDayText && stage !== 'ontrip' && stage !== 'return' && (
          <span className="text-[11px] font-semibold text-[#C49A6C] bg-[#C49A6C]/10 px-2 py-0.5 rounded-full flex-shrink-0">
            {dDayText}
          </span>
        )}
      </div>

      {/* 메시지 */}
      <div className="mb-3">
        {nudge.completedMessage && (
          <p className="text-[11px] text-[var(--accent)] font-medium mb-0.5">
            ✓ {nudge.completedMessage}
          </p>
        )}
        <p className="text-[13px] text-[var(--text-primary)] leading-snug">
          {nudge.nextMessage || (dDayText ? `출발일까지 ${dDayText}` : '즐거운 여행 되세요!')}
        </p>
      </div>

      {/* CTA 버튼들 */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleCta}
          className="text-[11px] px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-light)] transition-colors shadow-sm"
        >
          {nudge.ctaLabel}
        </button>
        {nudge.extKeys?.map((key) => {
          const ext = EXT[key];
          if (!ext) return null;
          const href = destination
            ? ext.buildUrl(destination, effectiveDate, returnDate)
            : ext.baseUrl;
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => GA.externalLinkClicked(ext.label)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {ext.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export { useCurrentStage };
