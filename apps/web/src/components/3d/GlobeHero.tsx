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
  const destCity = departureFlight?.arrival?.city || returnFlight?.departure?.city || '';

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] -mb-6 fade-in">
      {/* 하단 그라데이션 — 더 넓게 */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary) 10%, transparent)',
        }}
      />

      {/* 가치 제안 오버레이 — 배경 블러로 가독성 확보 */}
      <div className="absolute inset-x-0 bottom-4 z-20 pointer-events-none text-center px-5">
        <div className="inline-block px-5 py-2.5 rounded-2xl backdrop-blur-md bg-white/60 border border-white/40 shadow-sm">
          {!hasFlight ? (
            <>
              <p className="text-[14px] sm:text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">
                어디로 떠나시나요?
              </p>
              <p className="text-[11px] sm:text-[12px] text-[var(--text-secondary)] mt-0.5">
                항공편을 등록하면 여행이 시작됩니다
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] sm:text-[16px] font-semibold text-[var(--text-primary)] tracking-tight">
                {destCity ? `${destCity}까지의 여정` : '여행 준비 중'}
              </p>
              <div className="flex justify-center gap-4 mt-1">
                {departureFlight && (
                  <span className="text-[11px] font-medium text-[#C49A6C]">
                    {departureFlight.departure.airport} → {departureFlight.arrival.airport}
                  </span>
                )}
                {returnFlight && (
                  <span className="text-[11px] font-medium text-[var(--accent)]">
                    {returnFlight.departure.airport} → {returnFlight.arrival.airport}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <GlobeScene
          departureFlight={departureFlight}
          returnFlight={returnFlight}
        />
      </Suspense>
    </div>
  );
}
