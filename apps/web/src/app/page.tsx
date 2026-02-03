'use client';

import WeatherWidget from '@/components/bento/WeatherWidget';
import ScheduleWidget from '@/components/bento/ScheduleWidget';
import BudgetWidget from '@/components/bento/BudgetWidget';
import AirportStatusWidget from '@/components/bento/AirportStatusWidget';
import ClockWidget from '@/components/bento/ClockWidget';
import FlightCard from '@/components/bento/FlightCard';
import ReturnFlightCard from '@/components/bento/ReturnFlightCard';
import QuickLinkCard from '@/components/bento/QuickLinkCard';
import ItineraryWidget from '@/components/bento/ItineraryWidget';
import AccommodationCard from '@/components/bento/AccommodationCard';
import TransitFlightCard from '@/components/bento/TransitFlightCard';

import PhaseIndicator from '@/components/journey/PhaseIndicator';
import ShareButton from '@/components/bento/ShareButton';
import NudgeBar, { useCurrentStage } from '@/components/journey/NudgeBar';
import GlobeHero from '@/components/3d/GlobeHero';
import FeedbackButton from '@/components/bento/FeedbackButton';
import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyStage } from '@/types/journey';

/** 넛지 단계 → 강조할 위젯 ID 매핑 */
const STAGE_FOCUS: Record<JourneyStage, string[]> = {
  dreaming:      ['flight-card'],
  flight:        ['flight-card'],
  accommodation: ['accommodation-card'],
  itinerary:     ['itinerary-widget'],
  packing:       ['schedule-widget'],
  departure:     ['schedule-widget'],
  ontrip:        ['itinerary-widget', 'budget-widget'],
  return:        ['budget-widget'],
};

export default function Dashboard() {
  const { phase, departureFlight, returnFlight, transitFlights, reset } = useJourneyStore();
  const { stage } = useCurrentStage();

  const hasFlight = !!(departureFlight || returnFlight || transitFlights.length > 0);
  const focusIds = STAGE_FOCUS[stage] || [];
  const dim = (id: string) => focusIds.length > 0 && !focusIds.includes(id) ? 'opacity-60 transition-opacity duration-500' : 'transition-opacity duration-500';

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="px-5 pt-14 pb-2 max-w-3xl mx-auto fade-in">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">
              여행 대시보드
            </h1>
            <p className="text-[12px] sm:text-[13px] text-[var(--text-muted)] mt-0.5">
              들여다보는 것만으로 마음이 정리되는
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ShareButton />
            <PhaseIndicator />
          </div>
        </div>
      </header>

      {/* 3D Globe Hero */}
      <div className="max-w-3xl mx-auto">
        <GlobeHero departureFlight={departureFlight} returnFlight={returnFlight} transitFlights={transitFlights} />
      </div>

      {/* NudgeBar — 컨텍스트 인식 다음 행동 넛징 */}
      <div className="max-w-3xl mx-auto">
        <NudgeBar />
      </div>

      {/* Phase-Adaptive Bento Grid */}
      <section className="px-5 pt-0 pb-16 max-w-3xl mx-auto">

        {/* ──────────── 계획 (PLANNING) ──────────── */}
        {phase === 'planning' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 등록 */}
            <div id="flight-card" className={`col-span-2 fade-in-up fade-in-delay-1 ${dim('flight-card')}`}>
              <FlightCard />
            </div>
            <div className={`col-span-2 fade-in-up fade-in-delay-1 ${dim('flight-card')}`}>
              <ReturnFlightCard />
            </div>

            {/* 경유/이동편 — 출발편이 등록된 경우에만 표시 */}
            {departureFlight && (
              <div id="transit-flight-card" className={`col-span-2 md:col-span-4 fade-in-up fade-in-delay-1 ${dim('flight-card')}`}>
                <TransitFlightCard />
              </div>
            )}

            {/* 숙소 */}
            <div id="accommodation-card" className={`col-span-2 fade-in-up fade-in-delay-2 ${dim('accommodation-card')}`}>
              <AccommodationCard />
            </div>

            {/* 체크리스트 */}
            <div id="schedule-widget" className={`col-span-2 fade-in-up fade-in-delay-2 ${dim('schedule-widget')}`}>
              <ScheduleWidget />
            </div>

            {/* 예산 */}
            <div id="budget-widget" className={`col-span-2 fade-in-up fade-in-delay-3 ${dim('budget-widget')}`}>
              <BudgetWidget />
            </div>

            {/* 여행 일정 */}
            <div id="itinerary-widget" className={`col-span-2 fade-in-up fade-in-delay-3 ${dim('itinerary-widget')}`}>
              <ItineraryWidget />
            </div>

            {/* 목적지 날씨 + 출입국 안내 */}
            <div className="fade-in-up fade-in-delay-4">
              <WeatherWidget />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <QuickLinkCard href="/air/departure" title="출국 안내" subtitle="수속 절차" icon="✈️" />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <QuickLinkCard href="/air/arrival" title="입국 안내" subtitle="도착 절차" icon="🛬" />
            </div>
          </div>
        )}

        {/* ──────────── 여행 중 (TRAVELING) ──────────── */}
        {phase === 'traveling' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 실시간 */}
            <div id="flight-card" className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            {/* 경유/이동편 */}
            {(departureFlight || transitFlights.length > 0) && (
              <div id="transit-flight-card" className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
                <TransitFlightCard />
              </div>
            )}

            {/* 공항 현황 */}
            {hasFlight && (
              <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-2">
                <AirportStatusWidget />
              </div>
            )}

            {/* 현지 시간 + 날씨 */}
            <div className="fade-in-up fade-in-delay-3">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-3`}>
              <WeatherWidget />
            </div>

            {/* 숙소 */}
            <div id="accommodation-card" className="col-span-2 fade-in-up fade-in-delay-4">
              <AccommodationCard />
            </div>

            {/* 체크리스트 */}
            <div id="schedule-widget" className="col-span-2 fade-in-up fade-in-delay-4">
              <ScheduleWidget />
            </div>

            {/* 경비 추적 */}
            <div id="budget-widget" className="col-span-2 fade-in-up fade-in-delay-5">
              <BudgetWidget />
            </div>

            {/* 오늘 일정 */}
            <div id="itinerary-widget" className="col-span-2 fade-in-up fade-in-delay-5">
              <ItineraryWidget />
            </div>

          </div>
        )}
      </section>

      {/* 문의 버튼 */}
      <FeedbackButton />

      {/* Footer */}
      <footer className="text-center pb-8 space-y-2">
        <p className="text-[11px] text-[var(--text-muted)]">토키보</p>
        <button
          onClick={reset}
          className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          여행 초기화
        </button>
      </footer>
    </main>
  );
}
