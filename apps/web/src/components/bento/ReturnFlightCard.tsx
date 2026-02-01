'use client';

import { useState, useEffect, useCallback } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { FlightInfo } from '@/types/journey';
import { FLIGHT_STATUS_LABEL } from '@/types/journey';

const AIRLINES: Record<string, string> = {
  'KE': '대한항공', 'OZ': '아시아나항공', 'LJ': '진에어', 'TW': '티웨이항공',
  '7C': '제주항공', 'BX': '에어부산', 'RS': '에어서울', 'ZE': '이스타항공',
  'RF': '에어로케이', 'NH': 'ANA', 'JL': 'JAL', 'CX': '캐세이퍼시픽',
  'SQ': '싱가포르항공', 'TG': '타이항공', 'GA': '가루다인도네시아', 'VN': '베트남항공',
  'QR': '카타르항공', 'EK': '에미레이트', 'AA': '아메리칸항공', 'UA': '유나이티드',
  'DL': '델타항공', 'AF': '에어프랑스', 'LH': '루프트한자', 'BA': '브리티시항공',
  'MU': '중국동방항공', 'CA': '중국국제항공', 'CI': '중화항공', 'BR': '에바항공',
  'MM': '피치항공', 'QZ': '에어아시아',
};

const AIRPORT_CITY: Record<string, string> = {
  'ICN': '인천', 'GMP': '서울(김포)', 'PUS': '부산', 'CJU': '제주', 'TAE': '대구',
  'NRT': '도쿄(나리타)', 'HND': '도쿄(하네다)', 'KIX': '오사카', 'FUK': '후쿠오카',
  'CTS': '삿포로', 'OKA': '오키나와',
  'BKK': '방콕', 'HKT': '푸켓', 'CNX': '치앙마이',
  'SIN': '싱가포르', 'KUL': '쿠알라룸푸르',
  'HKG': '홍콩', 'TPE': '타이베이',
  'PVG': '상하이', 'PEK': '베이징',
  'DPS': '발리', 'CGK': '자카르타',
  'SGN': '호치민', 'HAN': '하노이', 'DAD': '다낭',
  'CEB': '세부', 'MNL': '마닐라',
  'CDG': '파리', 'LHR': '런던', 'FCO': '로마', 'IST': '이스탄불',
  'FRA': '프랑크푸르트', 'AMS': '암스테르담', 'BCN': '바르셀로나',
  'JFK': '뉴욕', 'LAX': 'LA', 'SFO': '샌프란시스코',
  'HNL': '하와이', 'GUM': '괌', 'SPN': '사이판',
  'SYD': '시드니', 'MEL': '멜버른',
  'DXB': '두바이', 'DOH': '도하',
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  scheduled: { bg: 'bg-[var(--border-light)]', text: 'text-[var(--text-secondary)]' },
  boarding:  { bg: 'bg-amber-50', text: 'text-amber-700' },
  departed:  { bg: 'bg-blue-50', text: 'text-blue-700' },
  in_air:    { bg: 'bg-blue-50', text: 'text-blue-700' },
  landed:    { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  arrived:   { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  delayed:   { bg: 'bg-red-50', text: 'text-red-600' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600' },
};

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return '--:--'; }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  } catch { return ''; }
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

function getCountdown(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return null;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export default function ReturnFlightCard() {
  const { returnFlight, setReturnFlight, clearReturnFlight } = useJourneyStore();

  const [retInput, setRetInput] = useState('');
  const [retDate, setRetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);

  const [manualDepAirport, setManualDepAirport] = useState('');
  const [manualDepTime, setManualDepTime] = useState('');
  const [manualArrAirport, setManualArrAirport] = useState('');
  const [manualArrTime, setManualArrTime] = useState('');

  const isPastDate = retDate ? new Date(retDate + 'T23:59:59') < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00') : false;
  const derivedAirline = retInput.length >= 2 ? (AIRLINES[retInput.slice(0, 2)] || '') : '';

  useEffect(() => {
    if (!returnFlight) { setCountdown(null); return; }
    const update = () => setCountdown(getCountdown(returnFlight.departure.scheduledTime));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [returnFlight]);

  const registerManualFlight = useCallback(() => {
    if (!retInput.trim() || !retDate) return;
    const depCode = manualDepAirport.toUpperCase();
    const arrCode = manualArrAirport.toUpperCase();
    const depDateTime = manualDepTime ? `${retDate}T${manualDepTime}:00` : `${retDate}T00:00:00`;
    const arrDateTime = manualArrTime ? `${retDate}T${manualArrTime}:00` : `${retDate}T00:00:00`;

    const depMs = new Date(depDateTime).getTime();
    const arrMs = new Date(arrDateTime).getTime();
    const duration = depMs && arrMs && arrMs > depMs ? Math.round((arrMs - depMs) / 60000) : 0;

    const airlineCode = retInput.trim().toUpperCase().slice(0, 2);
    const flight: FlightInfo = {
      flightNumber: retInput.trim().toUpperCase(),
      airline: AIRLINES[airlineCode] || airlineCode,
      departure: {
        airport: depCode,
        city: AIRPORT_CITY[depCode] || depCode,
        scheduledTime: depDateTime,
        terminal: undefined,
        gate: undefined,
      },
      arrival: {
        airport: arrCode,
        city: AIRPORT_CITY[arrCode] || arrCode,
        scheduledTime: arrDateTime,
        terminal: undefined,
      },
      status: 'landed',
      durationMinutes: duration,
      source: 'manual',
    };
    setReturnFlight(flight);
    setRetInput('');
  }, [retInput, retDate, manualDepAirport, manualDepTime, manualArrAirport, manualArrTime, setReturnFlight]);

  const searchFlight = useCallback(async () => {
    if (!retInput.trim()) return;
    setLoading(true);
    setError('');
    setSuggestion('');

    try {
      const params = new URLSearchParams({ number: retInput.trim() });
      if (retDate) params.set('date', retDate);
      const res = await fetch(`/api/flight?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || '조회에 실패했어요');
        if (body.suggestion) setSuggestion(body.suggestion);
        setLoading(false);
        return;
      }
      const flight: FlightInfo = await res.json();
      setReturnFlight(flight);
      setRetInput('');
    } catch {
      setError('네트워크 오류가 발생했어요');
    }
    setLoading(false);
  }, [retInput, retDate, setReturnFlight]);

  // ── 미등록: 입력 폼 ──
  if (!returnFlight) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">귀국편</p>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          귀국편을 등록하면 돌아오는 일정도 관리돼요
        </p>

        <form onSubmit={(e) => { e.preventDefault(); isPastDate ? registerManualFlight() : searchFlight(); }} className="space-y-3">
          {/* 1. 날짜 먼저 */}
          <div className="relative">
            {!retDate && (
              <span className="absolute left-0 top-0 text-xs text-[var(--text-muted)] pointer-events-none">
                귀국 날짜 선택
              </span>
            )}
            <input
              type="date"
              value={retDate}
              onChange={(e) => setRetDate(e.target.value)}
              className={`
                w-full bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1.5
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-300
                ${!retDate ? 'text-transparent' : ''}
              `}
            />
          </div>

          {isPastDate && (
            <p className="text-[10px] text-amber-500">
              과거 날짜는 API 조회가 불가하여 수동 입력합니다
            </p>
          )}

          {/* 2. 편명 + 버튼 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={retInput}
              onChange={(e) => setRetInput(e.target.value.toUpperCase())}
              placeholder="편명 (예: KE432)"
              maxLength={7}
              className="
                flex-1 bg-transparent text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)]
                border-b border-[var(--border)] pb-1.5
                focus:outline-none focus:border-[var(--accent)]
                transition-colors duration-300 uppercase tracking-wider
              "
            />
            <button
              type="submit"
              disabled={loading || (isPastDate && !retInput.trim())}
              className="
                text-[11px] px-3 py-1.5 rounded-full
                bg-[var(--text-primary)] text-white
                hover:bg-[var(--accent)] transition-colors
                disabled:opacity-50
              "
            >
              {isPastDate ? '등록' : loading ? '조회 중...' : '조회'}
            </button>
          </div>

          {/* 3. 과거 날짜: 수동 입력 (간소화) */}
          {isPastDate && (
            <div className="space-y-2 pt-1 border-t border-[var(--border)]">
              {derivedAirline && (
                <p className="text-[10px] text-[var(--text-secondary)]">{derivedAirline}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualDepAirport}
                  onChange={(e) => setManualDepAirport(e.target.value.toUpperCase())}
                  placeholder="출발 (ICN)"
                  maxLength={3}
                  className="
                    w-16 bg-transparent text-xs text-[var(--text-primary)]
                    placeholder:text-[var(--text-muted)]
                    border-b border-[var(--border)] pb-1
                    focus:outline-none focus:border-[var(--accent)]
                    transition-colors duration-300 uppercase text-center
                  "
                />
                {AIRPORT_CITY[manualDepAirport.toUpperCase()] && (
                  <span className="text-[10px] text-[var(--text-muted)]">{AIRPORT_CITY[manualDepAirport.toUpperCase()]}</span>
                )}
                <input
                  type="time"
                  value={manualDepTime}
                  onChange={(e) => setManualDepTime(e.target.value)}
                  className="
                    flex-1 bg-transparent text-xs text-[var(--text-primary)]
                    border-b border-[var(--border)] pb-1
                    focus:outline-none focus:border-[var(--accent)]
                    transition-colors duration-300
                  "
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualArrAirport}
                  onChange={(e) => setManualArrAirport(e.target.value.toUpperCase())}
                  placeholder="도착 (NRT)"
                  maxLength={3}
                  className="
                    w-16 bg-transparent text-xs text-[var(--text-primary)]
                    placeholder:text-[var(--text-muted)]
                    border-b border-[var(--border)] pb-1
                    focus:outline-none focus:border-[var(--accent)]
                    transition-colors duration-300 uppercase text-center
                  "
                />
                {AIRPORT_CITY[manualArrAirport.toUpperCase()] && (
                  <span className="text-[10px] text-[var(--text-muted)]">{AIRPORT_CITY[manualArrAirport.toUpperCase()]}</span>
                )}
                <input
                  type="time"
                  value={manualArrTime}
                  onChange={(e) => setManualArrTime(e.target.value)}
                  className="
                    flex-1 bg-transparent text-xs text-[var(--text-primary)]
                    border-b border-[var(--border)] pb-1
                    focus:outline-none focus:border-[var(--accent)]
                    transition-colors duration-300
                  "
                />
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="mt-2">
            <p className="text-[11px] text-red-400">{error}</p>
            {suggestion && <p className="text-[10px] text-[var(--text-muted)] mt-1">{suggestion}</p>}
          </div>
        )}
      </BentoCard>
    );
  }

  // ── 등록됨: 정보 표시 ──
  const ret = returnFlight;
  const statusStyle = STATUS_STYLES[ret.status] || STATUS_STYLES.scheduled;

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">귀국편</p>
        <button
          onClick={clearReturnFlight}
          className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          초기화
        </button>
      </div>

      <div className="space-y-3">
        {/* Flight number + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[var(--text-primary)] tracking-wider">
              {ret.flightNumber}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">{ret.airline}</span>
          </div>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
            {FLIGHT_STATUS_LABEL[ret.status] || ret.status}
          </span>
        </div>

        {/* Route visualization */}
        <div className="flex items-center gap-3">
          <div className="text-center min-w-0">
            <p className="text-lg bento-value">{formatTime(ret.departure.scheduledTime)}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{ret.departure.airport}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{ret.departure.city}</p>
          </div>

          <div className="flex-1 flex items-center gap-1 px-1">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <div className="flex flex-col items-center">
              <span className="text-[10px]">🛬</span>
              <span className="text-[9px] text-[var(--text-muted)]">{formatDuration(ret.durationMinutes)}</span>
            </div>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <div className="text-center min-w-0">
            <p className="text-lg bento-value">{formatTime(ret.arrival.scheduledTime)}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{ret.arrival.airport}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{ret.arrival.city}</p>
          </div>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{formatDate(ret.departure.scheduledTime)}</span>
          {ret.departure.terminal && <span>터미널 {ret.departure.terminal}</span>}
          {ret.departure.gate && <span>게이트 {ret.departure.gate}</span>}
          {ret.source && ret.source !== 'simulated' && (
            <span className="opacity-40">{ret.source}</span>
          )}
          {countdown && (
            <span className="text-[var(--accent)] font-medium ml-auto">{countdown}</span>
          )}
        </div>
      </div>
    </BentoCard>
  );
}
