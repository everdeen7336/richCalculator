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
import CanvasSearch from '@/components/journey/CanvasSearch';
import PhaseIndicator from '@/components/journey/PhaseIndicator';
import ShareButton from '@/components/bento/ShareButton';
import GlobeHero from '@/components/3d/GlobeHero';
import { useJourneyStore } from '@/stores/journey.store';

export default function Dashboard() {
  const { phase, departureFlight, returnFlight, reset } = useJourneyStore();

  const hasFlight = !!(departureFlight || returnFlight);

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
        <GlobeHero departureFlight={departureFlight} returnFlight={returnFlight} />
      </div>

      {/* Phase-Adaptive Bento Grid */}
      <section className="px-5 pt-0 pb-16 max-w-3xl mx-auto">

        {/* ──────────── 계획 (PLANNING) ──────────── */}
        {/* 여행자 상황: 여행 전, 계획 세우는 중 */}
        {/* 핵심: 항공편 등록 → 일정/예산 → 날씨 확인 → 출입국 안내 */}
        {phase === 'planning' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 등록 */}
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            {/* 체크리스트 (준비 + 항공편 등록 시 수속 추가) */}
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <ScheduleWidget />
            </div>

            {/* 예산 */}
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <BudgetWidget />
            </div>

            {/* 여행 일정 (장소 추가 → 일별 타임라인) */}
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <ItineraryWidget />
            </div>

            {/* 목적지 날씨 + 출입국 안내 */}
            <div className="fade-in-up fade-in-delay-3">
              <WeatherWidget />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <QuickLinkCard href="/air/departure" title="출국 안내" subtitle="수속 절차" icon="✈️" />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <QuickLinkCard href="/air/arrival" title="입국 안내" subtitle="도착 절차" icon="🛬" />
            </div>
            <div className="fade-in-up fade-in-delay-5">
              <CanvasSearch />
            </div>
          </div>
        )}

        {/* ──────────── 여행 중 (TRAVELING) ──────────── */}
        {/* 여행자 상황: 출발 당일 ~ 귀국까지 */}
        {/* 핵심: 실시간 항공편 → 공항 현황 → 시간/날씨 → 체크리스트 → 경비 */}
        {phase === 'traveling' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 실시간 */}
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

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

            {/* 체크리스트 (수속 + 입국) */}
            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <ScheduleWidget />
            </div>

            {/* 경비 추적 */}
            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <BudgetWidget />
            </div>

            {/* 오늘 일정 */}
            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <ItineraryWidget />
            </div>

            {/* 장소 검색 */}
            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <CanvasSearch />
            </div>
          </div>
        )}
      </section>

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
