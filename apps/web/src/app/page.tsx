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

        {/* ──────────── 준비 (PREPARING) ──────────── */}
        {/* 여행자 상황: 집/사무실에서 여행 계획 중 */}
        {/* 핵심: 항공편 등록 → 예산 세우기 → 일정 짜기 → 출입국 정보 */}
        {phase === 'preparing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 등록 */}
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            {/* 예산 + 일정 (준비 단계의 핵심) */}
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <BudgetWidget />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <ScheduleWidget />
            </div>

            {/* 목적지 날씨 (짐 싸기 참고) */}
            <div className="fade-in-up fade-in-delay-3">
              <WeatherWidget />
            </div>

            {/* 출입국 퀵링크 */}
            <div className="fade-in-up fade-in-delay-3">
              <QuickLinkCard href="/air/departure" title="출국 안내" subtitle="수속 절차" icon="✈️" />
            </div>
            <div className="fade-in-up fade-in-delay-4">
              <QuickLinkCard href="/air/arrival" title="입국 안내" subtitle="도착 절차" icon="🛬" />
            </div>

            {/* 장소 검색 */}
            <div className="fade-in-up fade-in-delay-4">
              <CanvasSearch />
            </div>
          </div>
        )}

        {/* ──────────── 조율 (COORDINATING) ──────────── */}
        {/* 여행자 상황: 출발 임박 D-3 ~ 당일, 공항 가는 중 */}
        {/* 핵심: 실시간 항공편 → 공항 현황 → 시간/날씨 → 체크리스트 */}
        {phase === 'coordinating' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 항공편 실시간 상태 (가장 중요) */}
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-1">
              <ReturnFlightCard />
            </div>

            {/* 공항 혼잡도/현황 */}
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-2">
              <AirportStatusWidget />
            </div>

            {/* 시간 + 날씨 (출발지 vs 도착지 비교) */}
            <div className="fade-in-up fade-in-delay-3">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-3`}>
              <WeatherWidget />
            </div>

            {/* 일정 확인 (출발 전 최종 점검) */}
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-4">
              <ScheduleWidget />
            </div>
          </div>
        )}

        {/* ──────────── 현지 (ONSITE) ──────────── */}
        {/* 여행자 상황: 목적지 도착, 여행 중 */}
        {/* 핵심: 현지 상황 → 현지 시간/날씨 → 일정 진행 → 경비 추적 → 귀국편 */}
        {phase === 'onsite' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 현지 컨텍스트 (오늘의 여행) */}
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
              <ContextCard />
            </div>

            {/* 현지 시간 + 날씨 */}
            <div className="fade-in-up fade-in-delay-2">
              <ClockWidget />
            </div>
            <div className={`${hasFlight ? 'col-span-1 md:col-span-3' : ''} fade-in-up fade-in-delay-2`}>
              <WeatherWidget />
            </div>

            {/* 오늘 일정 */}
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <ScheduleWidget />
            </div>

            {/* 경비 추적 */}
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <BudgetWidget />
            </div>

            {/* 귀국편 (하단에 조용히) */}
            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <ReturnFlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-4">
              <CanvasSearch />
            </div>
          </div>
        )}

        {/* ──────────── 기록 (RECORDING) ──────────── */}
        {/* 여행자 상황: 귀국 후, 여행 정리 */}
        {/* 핵심: 타임라인 → 경비 정산 → 항공편 기록 */}
        {phase === 'recording' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 여행 타임라인 (기록의 핵심) */}
            <div className="col-span-2 md:col-span-4 fade-in-up fade-in-delay-1">
              <RecordingTimeline />
            </div>

            {/* 경비 정산 */}
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <BudgetWidget />
            </div>

            {/* 일정 돌아보기 */}
            <div className="col-span-2 fade-in-up fade-in-delay-2">
              <ScheduleWidget />
            </div>

            {/* 항공편 기록 */}
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <FlightCard />
            </div>
            <div className="col-span-2 fade-in-up fade-in-delay-3">
              <ReturnFlightCard />
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
