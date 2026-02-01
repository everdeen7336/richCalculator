'use client';

import WeatherWidget from '@/components/bento/WeatherWidget';
import ScheduleWidget from '@/components/bento/ScheduleWidget';
import BudgetWidget from '@/components/bento/BudgetWidget';
import AirportStatusWidget from '@/components/bento/AirportStatusWidget';
import ClockWidget from '@/components/bento/ClockWidget';
import FlightCard from '@/components/bento/FlightCard';
import ReturnFlightCard from '@/components/bento/ReturnFlightCard';
import QuickLinkCard from '@/components/bento/QuickLinkCard';
import CanvasSearch from '@/components/journey/CanvasSearch';
import SoftNudge from '@/components/journey/SoftNudge';
import ContextCard from '@/components/journey/ContextCard';
import PhaseIndicator from '@/components/journey/PhaseIndicator';
import RecordingTimeline from '@/components/journey/RecordingTimeline';
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
          <PhaseIndicator />
        </div>
      </header>

      {/* 3D Globe Hero */}
      <div className="max-w-3xl mx-auto">
        <GlobeHero departureFlight={departureFlight} returnFlight={returnFlight} />
      </div>

      {/* Phase-Adaptive Bento Grid */}
      <section className="px-5 pt-0 pb-16 max-w-3xl mx-auto">

        {/* ──────────── PREPARING ──────────── */}
        {/* 여정 흐름: 항공편 등록 → 시간/날씨 확인 → 출입국 링크 → 검색/공항 → 예산/일정 */}
        {phase === 'preparing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 1행: 항공편 등록 (가장 먼저) */}
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            {/* 2행: 시간 + 날씨 (항공편 등록 후 목적지 정보 반영) */}
            <div className="fade-in-up fade-in-delay-2">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-2`}>
              <WeatherWidget />
            </div>
            {!hasFlight && (
              <>
                <div className="fade-in-up fade-in-delay-3">
                  <QuickLinkCard href="/air/departure" title="출국" subtitle="여행을 떠나요" icon="✈️" />
                </div>
                <div className="fade-in-up fade-in-delay-3">
                  <QuickLinkCard href="/air/arrival" title="입국" subtitle="돌아와요" icon="🛬" />
                </div>
              </>
            )}

            {/* 항공편 등록 후: 퀵링크 + 공항 현황 */}
            {hasFlight && (
              <>
                <div className="fade-in-up fade-in-delay-3">
                  <QuickLinkCard href="/air/departure" title="출국" subtitle="여행을 떠나요" icon="✈️" />
                </div>
                <div className="fade-in-up fade-in-delay-3">
                  <QuickLinkCard href="/air/arrival" title="입국" subtitle="돌아와요" icon="🛬" />
                </div>
                <div className="col-span-2 fade-in-up fade-in-delay-4">
                  <AirportStatusWidget />
                </div>
              </>
            )}

            {/* 검색 */}
            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <CanvasSearch />
            </div>
            {!hasFlight && (
              <div className="col-span-2 fade-in-up fade-in-delay-5">
                <AirportStatusWidget />
              </div>
            )}

            {/* 예산 + 일정 */}
            <div className="col-span-2 fade-in-up fade-in-delay-6">
              <BudgetWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-7">
              <ScheduleWidget />
            </div>
          </div>
        )}

        {/* ──────────── COORDINATING ──────────── */}
        {/* 여정 흐름: 항공편 확인 → 시간/날씨 비교 → 검색 → 예산/일정 */}
        {phase === 'coordinating' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            <div className="fade-in-up fade-in-delay-2">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-2`}>
              <WeatherWidget />
            </div>
            {!hasFlight && (
              <div className="col-span-2 fade-in-up fade-in-delay-3">
                <CanvasSearch />
              </div>
            )}
            {hasFlight && (
              <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-3">
                <CanvasSearch />
              </div>
            )}

            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <BudgetWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-6">
              <ScheduleWidget />
            </div>
          </div>
        )}

        {/* ──────────── ONSITE ──────────── */}
        {/* 여정 흐름: 컨텍스트(현지 상황) → 시간/날씨(현지 중심) → 항공편 → 예산/일정 */}
        {phase === 'onsite' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
              <ContextCard />
            </div>

            <div className="fade-in-up fade-in-delay-2">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-2`}>
              <WeatherWidget />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <ReturnFlightCard />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <BudgetWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-6">
              <ScheduleWidget />
            </div>
          </div>
        )}

        {/* ──────────── RECORDING ──────────── */}
        {phase === 'recording' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
              <RecordingTimeline />
            </div>

            <div className="fade-in-up fade-in-delay-3">
              <ClockWidget />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <WeatherWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <BudgetWidget />
            </div>
          </div>
        )}
      </section>

      {/* Soft-Nudge AI — coordinating 단계에서만 */}
      {phase === 'coordinating' && <SoftNudge />}

      {/* Footer with reset */}
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
