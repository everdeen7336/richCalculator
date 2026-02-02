'use client';

import { useMemo } from 'react';
import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyStage } from '@/types/journey';
import { STAGE_META } from '@/types/journey';

/** 여정 단계별 넛지 정의 */
interface NudgeConfig {
  stage: JourneyStage;
  completedMessage: string;
  nextMessage: string;
  ctaLabel: string;
  ctaAction: string; // scroll target id or action key
  externalLinks?: { label: string; url: string }[];
}

const NUDGE_MAP: NudgeConfig[] = [
  {
    stage: 'dreaming',
    completedMessage: '',
    nextMessage: '여행 날짜와 목적지를 정해보세요',
    ctaLabel: '항공편 등록',
    ctaAction: '#flight-card',
  },
  {
    stage: 'flight',
    completedMessage: '목적지가 정해졌어요!',
    nextMessage: '항공편을 등록하면 실시간 추적이 시작돼요',
    ctaLabel: '편명 등록',
    ctaAction: '#flight-card',
    externalLinks: [
      { label: '스카이스캐너', url: 'https://www.skyscanner.co.kr' },
    ],
  },
  {
    stage: 'accommodation',
    completedMessage: '항공편 등록 완료!',
    nextMessage: '다음은 숙소를 정해볼까요?',
    ctaLabel: '숙소 등록',
    ctaAction: '#accommodation-card',
    externalLinks: [
      { label: 'Booking.com', url: 'https://www.booking.com' },
      { label: '에어비앤비', url: 'https://www.airbnb.co.kr' },
    ],
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

    // 여행 일수 계산
    const tripDays = (depTime && retTime)
      ? Math.max(1, Math.ceil((new Date(retTime).getTime() - new Date(depTime).getTime()) / 86400000))
      : 3;

    const completed: JourneyStage[] = [];
    let current: JourneyStage = 'dreaming';

    // S1
    if (destination && departureDate) {
      completed.push('dreaming');
      current = 'flight';
    }

    // S2
    if (departureFlight) {
      completed.push('flight');
      current = 'accommodation';
    }

    // S3
    if (accommodations.length > 0) {
      completed.push('accommodation');
      current = 'itinerary';
    }

    // S4
    if (items.length >= tripDays * 2) {
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
  const { setPhase, destination, departureDate } = useJourneyStore();

  const nudge = NUDGE_MAP.find((n) => n.stage === stage);
  if (!nudge) return null;

  const dDayText = useMemo(() => {
    if (!departureDate) return '';
    const diff = Math.ceil((new Date(departureDate + 'T00:00:00').getTime() - Date.now()) / 86400000);
    if (diff < 0) return '';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  }, [departureDate]);

  const handleCta = () => {
    if (nudge.ctaAction === 'switch-traveling') {
      setPhase('traveling');
      return;
    }
    const el = document.querySelector(nudge.ctaAction);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const allStages: JourneyStage[] = ['dreaming', 'flight', 'accommodation', 'itinerary', 'packing', 'departure', 'ontrip', 'return'];

  return (
    <div className="mx-5 mb-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-light)] p-4 shadow-sm fade-in-up">
      {/* 메시지 */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          {nudge.completedMessage && (
            <p className="text-[12px] text-[var(--accent)] font-medium mb-0.5">
              ✓ {nudge.completedMessage}
            </p>
          )}
          <p className="text-[13px] text-[var(--text-primary)] font-medium">
            👉 {nudge.nextMessage || (dDayText ? `출발일까지 ${dDayText}` : '여행을 즐기세요!')}
          </p>
        </div>
        {dDayText && stage !== 'ontrip' && stage !== 'return' && (
          <span className="text-[12px] font-bold text-[#C49A6C] flex-shrink-0">{dDayText}</span>
        )}
      </div>

      {/* CTA 버튼들 */}
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={handleCta}
          className="text-[11px] px-3 py-1.5 rounded-full bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
        >
          {nudge.ctaLabel}
        </button>
        {nudge.externalLinks?.map((link) => (
          <a
            key={link.label}
            href={destination ? `${link.url}/searchresults.html?ss=${encodeURIComponent(destination)}` : link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            {link.label}에서 검색
          </a>
        ))}
      </div>

      {/* 프로그레스 도트 */}
      <div className="flex items-center gap-1.5">
        <div className="flex gap-1">
          {allStages.map((s) => {
            const meta = STAGE_META[s];
            const done = completedStages.includes(s);
            const active = s === stage;
            return (
              <div
                key={s}
                title={meta.label}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  done
                    ? 'bg-[var(--accent)]'
                    : active
                      ? 'bg-[var(--accent)] opacity-50 animate-pulse'
                      : 'bg-[var(--border)]'
                }`}
              />
            );
          })}
        </div>
        <span className="text-[10px] text-[var(--text-muted)] ml-1">여행 준비 {percent}%</span>
      </div>
    </div>
  );
}

export { useCurrentStage };
