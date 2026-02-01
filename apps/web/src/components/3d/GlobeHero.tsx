'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import type { FlightInfo } from '@/types/journey';

const GlobeScene = dynamic(() => import('./GlobeScene'), {
  ssr: false,
  loading: () => null,
});

interface GlobeHeroProps {
  departureFlight: FlightInfo | null;
  returnFlight: FlightInfo | null;
}

export default function GlobeHero({
  departureFlight,
  returnFlight,
}: GlobeHeroProps) {
  const hasFlight = !!(departureFlight || returnFlight);

  return (
    <div className="relative w-full h-[240px] sm:h-[320px] -mb-4 fade-in">
      {/* 하단 그라데이션 (벤토 그리드와 자연스러운 연결) */}
      <div
        className="absolute inset-x-0 bottom-0 h-20 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />

      {/* 비행편 라벨 */}
      {hasFlight && (
        <div className="absolute top-3 left-0 right-0 z-10 flex justify-center gap-4 text-[10px] pointer-events-none">
          {departureFlight && (
            <span className="text-[#C49A6C]/70">
              {departureFlight.departure.airport} → {departureFlight.arrival.airport}
            </span>
          )}
          {returnFlight && (
            <span className="text-[var(--accent)]/70">
              {returnFlight.departure.airport} → {returnFlight.arrival.airport}
            </span>
          )}
        </div>
      )}

      <Suspense fallback={null}>
        <GlobeScene
          departureFlight={departureFlight}
          returnFlight={returnFlight}
        />
      </Suspense>
    </div>
  );
}
