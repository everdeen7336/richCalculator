'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { FlightInfo } from '@/types/journey';

interface MiniWeather {
  temp: number;
  icon: string;
}

const weatherEmoji: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '🌨️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
};

const AIRPORT_WEATHER_CITY: Record<string, string> = {
  ICN: '인천', GMP: '서울', PUS: '부산', CJU: '제주',
  NRT: '도쿄', HND: '도쿄', KIX: '오사카', FUK: '후쿠오카',
  CTS: '삿포로', OKA: '오키나와',
  BKK: '방콕', HKT: '푸켓', CNX: '치앙마이',
  SIN: '싱가포르', KUL: '쿠알라룸푸르',
  HKG: '홍콩', TPE: '타이베이',
  PVG: '상하이', PEK: '베이징',
  DPS: '발리', CGK: '자카르타',
  SGN: '호치민', HAN: '하노이', DAD: '다낭',
  CEB: '세부', MNL: '마닐라',
  CDG: '파리', LHR: '런던', FCO: '로마', IST: '이스탄불',
  FRA: '프랑크푸르트', AMS: '암스테르담', BCN: '바르셀로나',
  JFK: '뉴욕', LAX: 'LA', SFO: '샌프란시스코',
  HNL: '하와이', GUM: '괌', SPN: '사이판',
  SYD: '시드니', MEL: '멜버른',
  DXB: '두바이', DOH: '도하',
};

const GlobeScene = dynamic(() => import('./GlobeScene'), {
  ssr: false,
  loading: () => null,
});

interface GlobeHeroProps {
  departureFlight: FlightInfo | null;
  returnFlight: FlightInfo | null;
  transitFlights?: FlightInfo[];
}

/** 현지 시간 */
function useLocalTime(timezone?: string) {
  const [time, setTime] = useState('');
  useEffect(() => {
    if (!timezone) return;
    const update = () => {
      try {
        setTime(new Date().toLocaleTimeString('ko-KR', {
          timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
        }));
      } catch { /* invalid tz */ }
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

const AIRPORT_TZ: Record<string, string> = {
  ICN: 'Asia/Seoul', GMP: 'Asia/Seoul', PUS: 'Asia/Seoul', CJU: 'Asia/Seoul',
  NRT: 'Asia/Tokyo', HND: 'Asia/Tokyo', KIX: 'Asia/Tokyo', FUK: 'Asia/Tokyo', CTS: 'Asia/Tokyo', OKA: 'Asia/Tokyo',
  BKK: 'Asia/Bangkok', HKT: 'Asia/Bangkok', CNX: 'Asia/Bangkok',
  SIN: 'Asia/Singapore', KUL: 'Asia/Kuala_Lumpur',
  HKG: 'Asia/Hong_Kong', TPE: 'Asia/Taipei',
  PVG: 'Asia/Shanghai', PEK: 'Asia/Shanghai',
  DPS: 'Asia/Makassar', CGK: 'Asia/Jakarta',
  SGN: 'Asia/Ho_Chi_Minh', HAN: 'Asia/Ho_Chi_Minh', DAD: 'Asia/Ho_Chi_Minh',
  CEB: 'Asia/Manila', MNL: 'Asia/Manila',
  CDG: 'Europe/Paris', LHR: 'Europe/London', FCO: 'Europe/Rome',
  FRA: 'Europe/Berlin', AMS: 'Europe/Amsterdam', BCN: 'Europe/Madrid', IST: 'Europe/Istanbul',
  JFK: 'America/New_York', LAX: 'America/Los_Angeles', SFO: 'America/Los_Angeles',
  HNL: 'Pacific/Honolulu', GUM: 'Pacific/Guam', SPN: 'Pacific/Guam',
  SYD: 'Australia/Sydney', MEL: 'Australia/Melbourne',
  DXB: 'Asia/Dubai', DOH: 'Asia/Qatar',
};

/** 공항 코드로 날씨 fetch */
function useAirportWeather(airport?: string, city?: string): MiniWeather | null {
  const [weather, setWeather] = useState<MiniWeather | null>(null);

  const fetchWeather = useCallback(async () => {
    const cityName = (airport && AIRPORT_WEATHER_CITY[airport]) || city;
    if (!cityName) return;
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(cityName)}`);
      if (!res.ok) return;
      const data = await res.json();
      setWeather({ temp: data.temp, icon: data.icon });
    } catch { /* ignore */ }
  }, [airport, city]);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchWeather]);

  return weather;
}

export default function GlobeHero({ departureFlight, returnFlight, transitFlights = [] }: GlobeHeroProps) {
  const hasFlight = !!(departureFlight || returnFlight || transitFlights.length > 0);
  // 최종 도착지: 마지막 transit flight의 도착지 또는 출발편 도착지
  const lastTransit = transitFlights.length > 0 ? transitFlights[transitFlights.length - 1] : null;
  const destCity = lastTransit?.arrival?.city || departureFlight?.arrival?.city || returnFlight?.departure?.city || '';
  const depCity = departureFlight?.departure?.city || '';
  const depAirport = departureFlight?.departure?.airport || '';
  const arrAirport = departureFlight?.arrival?.airport || '';

  const depTime = useLocalTime(AIRPORT_TZ[depAirport]);
  const arrTime = useLocalTime(AIRPORT_TZ[arrAirport]);

  const depWeather = useAirportWeather(depAirport, depCity);
  const arrWeather = useAirportWeather(arrAirport, destCity);

  const depDate = departureFlight?.departure?.scheduledTime
    ? new Date(departureFlight.departure.scheduledTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '';
  const retDate = returnFlight?.arrival?.scheduledTime
    ? new Date(returnFlight.arrival.scheduledTime).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
    : '';

  return (
    <div className="relative w-full h-[260px] sm:h-[340px] -mb-6 fade-in">
      {/* 하단 그라데이션 */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--bg-primary) 10%, transparent)' }}
      />

      {/* 출발지 (좌측) */}
      {hasFlight && depCity && (
        <div className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="backdrop-blur-md bg-white/50 border border-white/30 rounded-xl px-2.5 py-2 shadow-sm">
            <p className="text-[9px] text-[var(--text-muted)]">출발</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight">{depCity}</p>
            <p className="text-[10px] text-[var(--text-secondary)] tabular-nums">{depAirport}</p>
            {(depTime || depWeather) && (
              <div className="flex items-center gap-1.5 mt-1">
                {depTime && <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">{depTime}</span>}
                {depWeather && <span className="text-[11px]">{weatherEmoji[depWeather.icon] || '🌤️'}{depWeather.temp}°</span>}
              </div>
            )}
            {depDate && (
              <p className="text-[9px] text-[var(--text-muted)]">{depDate}</p>
            )}
          </div>
        </div>
      )}

      {/* 도착지 (우측) */}
      {hasFlight && destCity && (
        <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
          <div className="backdrop-blur-md bg-white/50 border border-white/30 rounded-xl px-2.5 py-2 shadow-sm text-right">
            <p className="text-[9px] text-[var(--text-muted)]">도착</p>
            <p className="text-[12px] font-semibold text-[var(--text-primary)] leading-tight">{destCity}</p>
            <p className="text-[10px] text-[var(--text-secondary)] tabular-nums">{arrAirport}</p>
            {(arrTime || arrWeather) && (
              <div className="flex items-center justify-end gap-1.5 mt-1">
                {arrWeather && <span className="text-[11px]">{weatherEmoji[arrWeather.icon] || '🌤️'}{arrWeather.temp}°</span>}
                {arrTime && <span className="text-[13px] font-medium text-[var(--text-primary)] tabular-nums">{arrTime}</span>}
              </div>
            )}
            {retDate && (
              <p className="text-[9px] text-[var(--text-muted)]">{retDate} 귀국</p>
            )}
          </div>
        </div>
      )}

      {/* 중앙 하단 */}
      <div className="absolute inset-x-0 bottom-4 z-20 pointer-events-none text-center px-5">
        <div className="inline-block px-5 py-2 rounded-2xl backdrop-blur-md bg-white/60 border border-white/40 shadow-sm">
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
            <p className="text-[13px] sm:text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">
              {(() => {
                if (!depCity && !destCity) return '여행 준비 중';
                // Build multi-city route: 인천 → 도쿄 → 방콕 → 인천
                const cities: string[] = [];
                if (depCity) cities.push(depCity);
                if (departureFlight?.arrival?.city && departureFlight.arrival.city !== depCity) {
                  cities.push(departureFlight.arrival.city);
                }
                for (const fl of transitFlights) {
                  if (fl.arrival?.city && !cities.includes(fl.arrival.city)) {
                    cities.push(fl.arrival.city);
                  }
                }
                if (returnFlight?.arrival?.city && !cities.includes(returnFlight.arrival.city)) {
                  cities.push(returnFlight.arrival.city);
                }
                return cities.join(' → ');
              })()}
            </p>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <GlobeScene departureFlight={departureFlight} returnFlight={returnFlight} transitFlights={transitFlights} />
      </Suspense>
    </div>
  );
}
