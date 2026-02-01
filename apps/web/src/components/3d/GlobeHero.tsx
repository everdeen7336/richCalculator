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

  // 도착 도시명
  const destCity = departureFlight?.arrival?.city || returnFlight?.departure?.city || '';

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] -mb-6 fade-in">
      {/* 하단 그라데이션 */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-primary), transparent)',
        }}
      />

      {/* 가치 제안 오버레이 */}
      <div className="absolute inset-x-0 bottom-6 z-20 pointer-events-none text-center px-5">
        {!hasFlight ? (
          <>
            <p className="text-[13px] sm:text-[15px] font-semibold text-[var(--text-primary)]">
              어디로 떠나시나요?
            </p>
            <p className="text-[11px] sm:text-[12px] text-[var(--text-muted)] mt-1">
              항공편을 등록하면 여행이 시작됩니다
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] sm:text-[15px] font-semibold text-[var(--text-primary)]">
              {destCity ? `${destCity}까지의 여정` : '여행 준비 중'}
            </p>
            <div className="flex justify-center gap-4 mt-1.5 text-[10px]">
              {departureFlight && (
                <span className="text-[#C49A6C]">
                  {departureFlight.departure.airport} → {departureFlight.arrival.airport}
                </span>
              )}
              {returnFlight && (
                <span className="text-[var(--accent)]">
                  {returnFlight.departure.airport} → {returnFlight.arrival.airport}
                </span>
              )}
            </div>
          </>
        )}
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
