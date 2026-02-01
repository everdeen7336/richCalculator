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
import { useJourneyStore } from '@/stores/journey.store';

export default function Dashboard() {
  const { phase, reset } = useJourneyStore();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="px-5 pt-14 pb-2 max-w-3xl mx-auto fade-in">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              여행 대시보드
            </h1>
            <p className="text-[13px] text-[var(--text-muted)] mt-0.5">
              들여다보는 것만으로 마음이 정리되는
            </p>
          </div>
          <PhaseIndicator />
        </div>
      </header>

      {/* Phase-Adaptive Bento Grid */}
      <section className="px-5 pt-5 pb-16 max-w-3xl mx-auto">

        {/* ──────────── PREPARING ──────────── */}
        {phase === 'preparing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="fade-in-up fade-in-delay-1">
              <ClockWidget />
            </div>
            <div className="fade-in-up fade-in-delay-2">
              <WeatherWidget />
            </div>
            <div className="fade-in-up fade-in-delay-3">
              <QuickLinkCard href="/air/departure" title="출국" subtitle="여행을 떠나요" icon="✈️" />
            </div>
            <div className="fade-in-up fade-in-delay-3">
              <QuickLinkCard href="/air/arrival" title="입국" subtitle="돌아와요" icon="🛬" />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <ReturnFlightCard />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-5">
              <CanvasSearch />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-6">
              <AirportStatusWidget />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-6">
              <BudgetWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-7">
              <ScheduleWidget />
            </div>
          </div>
        )}

        {/* ──────────── COORDINATING ──────────── */}
        {phase === 'coordinating' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <CanvasSearch />
            </div>
            <div className="fade-in-up fade-in-delay-2">
              <ClockWidget />
            </div>
            <div className="fade-in-up fade-in-delay-3">
              <WeatherWidget />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-4">
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

        {/* ──────────── ONSITE ──────────── */}
        {phase === 'onsite' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
              <ContextCard />
            </div>

            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <ReturnFlightCard />
            </div>
            <div className="fade-in-up fade-in-delay-3">
              <WeatherWidget />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <ClockWidget />
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

            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <BudgetWidget />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <ClockWidget />
            </div>
            <div className="fade-in-up fade-in-delay-5">
              <WeatherWidget />
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
