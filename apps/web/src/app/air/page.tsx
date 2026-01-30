'use client';

import Link from 'next/link';
import { Terminal, TERMINAL_CONFIG } from '@/types';
import { useForecast } from '@/hooks/useForecast';
import { useParking } from '@/hooks/useParking';

/** 혼잡 레벨 (간략) */
function getQuickLevel(value: number, peak: number): { label: string; emoji: string; color: string } {
  if (peak === 0) return { label: '정보없음', emoji: '⏳', color: 'text-gray-400' };
  const ratio = value / peak;
  if (ratio <= 0.3) return { label: '한산', emoji: '😊', color: 'text-green-600' };
  if (ratio <= 0.55) return { label: '보통', emoji: '🙂', color: 'text-yellow-600' };
  if (ratio <= 0.8) return { label: '혼잡', emoji: '😰', color: 'text-orange-600' };
  return { label: '매우혼잡', emoji: '🔥', color: 'text-red-600' };
}

function TerminalSnapshot({ terminal }: { terminal: Terminal }) {
  const { data: forecastData } = useForecast(terminal);
  const { data: parkingData } = useParking(terminal);

  const currentHour = new Date().getHours();
  const forecast = forecastData?.data;
  const parking = parkingData?.data;

  const depTotal = forecast?.inOutData?.[currentHour]?.departure.total ?? 0;
  const depPeak = forecast?.summary.peakDepartureCount ?? 0;
  const arrTotal = forecast?.inOutData?.[currentHour]?.arrival.total ?? 0;
  const arrPeak = forecast?.summary.peakArrivalCount ?? 0;

  const depLevel = getQuickLevel(depTotal, depPeak);
  const arrLevel = getQuickLevel(arrTotal, arrPeak);

  const shortTermAvail = parking?.shortTerm.totalAvailable ?? null;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-700 mb-2">
        {TERMINAL_CONFIG[terminal].nameKo}
      </h3>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">주차장</p>
          <p className="text-sm font-bold">
            {shortTermAvail !== null ? (
              shortTermAvail > 0 ? (
                <span className="text-green-600">🅿️ {shortTermAvail}대</span>
              ) : (
                <span className="text-red-500">🅿️ 만차</span>
              )
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">출국장</p>
          <p className={`text-sm font-bold ${depLevel.color}`}>
            {depLevel.emoji} {depLevel.label}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 mb-0.5">입국장</p>
          <p className={`text-sm font-bold ${arrLevel.color}`}>
            {arrLevel.emoji} {arrLevel.label}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AirHubPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      {/* 헤더 */}
      <header className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">인천공항 여행 가이드</h1>
        <p className="text-sm text-gray-500">지금 어떤 상황인가요?</p>
      </header>

      {/* 여정 선택 카드 */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/air/departure"
          className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
        >
          <div className="relative z-10">
            <span className="text-4xl block mb-3">✈️</span>
            <h2 className="text-xl font-bold mb-1">출국</h2>
            <p className="text-blue-100 text-xs leading-relaxed">
              여행을 떠나요
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[80px] opacity-10 group-hover:opacity-20 transition-opacity">
            ✈️
          </div>
        </Link>

        <Link
          href="/air/arrival"
          className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden"
        >
          <div className="relative z-10">
            <span className="text-4xl block mb-3">🛬</span>
            <h2 className="text-xl font-bold mb-1">입국</h2>
            <p className="text-emerald-100 text-xs leading-relaxed">
              돌아와요
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-[80px] opacity-10 group-hover:opacity-20 transition-opacity">
            🛬
          </div>
        </Link>
      </div>

      {/* 실시간 요약 */}
      <section>
        <h2 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          지금 공항은?
        </h2>
        <div className="space-y-3">
          <TerminalSnapshot terminal={Terminal.T1} />
          <TerminalSnapshot terminal={Terminal.T2} />
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-3">
          주차: 실시간 · 혼잡도: 예측 데이터
        </p>
      </section>
    </main>
  );
}
