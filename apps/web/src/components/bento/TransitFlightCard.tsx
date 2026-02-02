'use client';

import { useState, useCallback } from 'react';
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
  boarding:  { bg: 'bg-[#FDF6EE]', text: 'text-[#B8863A]' },
  departed:  { bg: 'bg-[#EEF4FB]', text: 'text-[#4A7BA7]' },
  in_air:    { bg: 'bg-[#EEF4FB]', text: 'text-[#4A7BA7]' },
  landed:    { bg: 'bg-[#EFF7F3]', text: 'text-[#4A8A6E]' },
  arrived:   { bg: 'bg-[#EFF7F3]', text: 'text-[#4A8A6E]' },
  delayed:   { bg: 'bg-[#FDF1F0]', text: 'text-[#C4564A]' },
  cancelled: { bg: 'bg-[#FDF1F0]', text: 'text-[#C4564A]' },
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

/** 경유/이동 항공편 목록 + 추가 폼 */
export default function TransitFlightCard() {
  const { transitFlights, addTransitFlight, removeTransitFlight } = useJourneyStore();
  const [showForm, setShowForm] = useState(false);
  const [flightInput, setFlightInput] = useState('');
  const [flightDate, setFlightDate] = useState('');
  const [depAirport, setDepAirport] = useState('');
  const [depTime, setDepTime] = useState('');
  const [arrAirport, setArrAirport] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forceManual, setForceManual] = useState(false);

  const isPastDate = flightDate ? new Date(flightDate + 'T23:59:59') < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00') : false;
  const showManualFields = isPastDate || forceManual;
  const derivedAirline = flightInput.length >= 2 ? (AIRLINES[flightInput.slice(0, 2)] || '') : '';

  const registerManual = useCallback(() => {
    if (!flightInput.trim() || !flightDate) return;
    const dCode = depAirport.toUpperCase();
    const aCode = arrAirport.toUpperCase();
    const depDateTime = depTime ? `${flightDate}T${depTime}:00` : `${flightDate}T00:00:00`;
    let arrDateTime = arrTime ? `${flightDate}T${arrTime}:00` : `${flightDate}T00:00:00`;
    const depMs = new Date(depDateTime).getTime();
    let arrMs = new Date(arrDateTime).getTime();
    // 야간 비행: 도착 시각이 출발보다 이르면 다음날로 처리
    if (arrTime && depTime && arrMs <= depMs) {
      const nextDay = new Date(new Date(flightDate).getTime() + 86400000).toISOString().split('T')[0];
      arrDateTime = `${nextDay}T${arrTime}:00`;
      arrMs = new Date(arrDateTime).getTime();
    }
    const duration = depMs && arrMs && arrMs > depMs ? Math.round((arrMs - depMs) / 60000) : 0;
    const airlineCode = flightInput.trim().toUpperCase().slice(0, 2);

    const flight: FlightInfo = {
      flightNumber: flightInput.trim().toUpperCase(),
      airline: AIRLINES[airlineCode] || airlineCode,
      departure: { airport: dCode, city: AIRPORT_CITY[dCode] || dCode, scheduledTime: depDateTime },
      arrival: { airport: aCode, city: AIRPORT_CITY[aCode] || aCode, scheduledTime: arrDateTime },
      status: 'scheduled',
      durationMinutes: duration,
      source: 'manual',
    };
    addTransitFlight(flight);
    resetForm();
  }, [flightInput, flightDate, depAirport, depTime, arrAirport, arrTime, addTransitFlight]);

  const searchFlight = useCallback(async () => {
    if (!flightInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ number: flightInput.trim() });
      if (flightDate) params.set('date', flightDate);
      const res = await fetch(`/api/flight?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || '편명을 다시 확인해주세요');
        setLoading(false);
        return;
      }
      const flight: FlightInfo = await res.json();
      addTransitFlight(flight);
      resetForm();
    } catch {
      setError('네트워크 오류가 발생했어요');
    }
    setLoading(false);
  }, [flightInput, flightDate, addTransitFlight]);

  const resetForm = () => {
    setFlightInput(''); setFlightDate(''); setDepAirport(''); setDepTime('');
    setArrAirport(''); setArrTime(''); setShowForm(false); setForceManual(false); setError('');
  };

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">경유 / 이동편</p>
        <span className="text-[10px] text-[var(--text-muted)]">{transitFlights.length}건</span>
      </div>

      {transitFlights.length === 0 && !showForm && (
        <p className="text-xs text-[var(--text-muted)] mb-3">
          여러 도시를 이동하는 항공편을 등록하세요
        </p>
      )}

      {/* 등록된 경유편 목록 */}
      {transitFlights.length > 0 && (
        <div className="space-y-2.5 mb-3">
          {transitFlights.map((fl, idx) => {
            const style = STATUS_STYLES[fl.status] || STATUS_STYLES.scheduled;
            return (
              <div key={idx} className="rounded-xl bg-[var(--bg-secondary)]/50 p-2.5">
                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--border-light)] px-1.5 py-0.5 rounded-full">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-[var(--text-primary)] tracking-wider">
                      {fl.flightNumber}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{fl.airline}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                      {FLIGHT_STATUS_LABEL[fl.status] || fl.status}
                    </span>
                    <button
                      onClick={() => removeTransitFlight(idx)}
                      className="text-[10px] text-[var(--text-muted)] hover:text-[#C4564A] transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2">
                  <div className="text-center min-w-0">
                    <p className="text-sm bento-value">{formatTime(fl.departure.scheduledTime)}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{fl.departure.airport}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{fl.departure.city}</p>
                  </div>
                  <div className="flex-1 flex items-center gap-1 px-1">
                    <div className="h-px flex-1 bg-[var(--border)]" />
                    <div className="flex flex-col items-center">
                      <span className="text-[9px]">✈️</span>
                      {fl.durationMinutes > 0 && (
                        <span className="text-[8px] text-[var(--text-muted)]">{formatDuration(fl.durationMinutes)}</span>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-[var(--border)]" />
                  </div>
                  <div className="text-center min-w-0">
                    <p className="text-sm bento-value">{formatTime(fl.arrival.scheduledTime)}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{fl.arrival.airport}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{fl.arrival.city}</p>
                  </div>
                </div>

                {/* Date */}
                <p className="text-[9px] text-[var(--text-muted)] mt-1">{formatDate(fl.departure.scheduledTime)}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* 추가 버튼 / 폼 */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="
            w-full py-2 rounded-xl border border-dashed border-[var(--border)]
            text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]
            hover:border-[var(--accent)] transition-all duration-200
          "
        >
          + 이동편 추가
        </button>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); showManualFields ? registerManual() : searchFlight(); }}
          className="space-y-2.5 pt-2 border-t border-[var(--border-light)]"
        >
          {/* 날짜 */}
          <div className="relative">
            {!flightDate && (
              <span className="absolute left-0 top-0 text-xs text-[var(--text-muted)] pointer-events-none">
                출발 날짜
              </span>
            )}
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className={`
                w-full bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1.5
                focus:outline-none focus:border-[var(--accent)] transition-colors
                ${!flightDate ? 'text-transparent' : ''}
              `}
            />
          </div>

          {showManualFields && (
            <p className="text-[10px] text-[#B8863A]">
              {forceManual ? '수동으로 입력합니다' : '과거 날짜는 수동 입력합니다'}
            </p>
          )}

          {/* 편명 + 버튼 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={flightInput}
              onChange={(e) => setFlightInput(e.target.value.toUpperCase())}
              placeholder="편명 (예: VN123)"
              maxLength={7}
              className="
                flex-1 bg-transparent text-sm text-[var(--text-primary)]
                placeholder:text-[var(--text-muted)]
                border-b border-[var(--border)] pb-1.5
                focus:outline-none focus:border-[var(--accent)]
                uppercase tracking-wider
              "
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || (showManualFields && !flightInput.trim())}
              className="
                text-[11px] px-3 py-1.5 rounded-full
                bg-[var(--text-primary)] text-white
                hover:bg-[var(--accent)] transition-colors disabled:opacity-50
              "
            >
              {showManualFields ? '등록' : loading ? '조회 중...' : '조회'}
            </button>
          </div>

          {/* 수동 입력 필드 */}
          {showManualFields && (
            <div className="space-y-2 pt-1 border-t border-[var(--border)]">
              {derivedAirline && (
                <p className="text-[10px] text-[var(--text-secondary)]">{derivedAirline}</p>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text" value={depAirport}
                  onChange={(e) => setDepAirport(e.target.value.toUpperCase())}
                  placeholder="출발 (NRT)" maxLength={3}
                  className="w-16 bg-transparent text-xs text-center uppercase border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                {AIRPORT_CITY[depAirport.toUpperCase()] && (
                  <span className="text-[10px] text-[var(--text-muted)]">{AIRPORT_CITY[depAirport.toUpperCase()]}</span>
                )}
                <input
                  type="time" value={depTime}
                  onChange={(e) => setDepTime(e.target.value)}
                  className="flex-1 bg-transparent text-xs border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text" value={arrAirport}
                  onChange={(e) => setArrAirport(e.target.value.toUpperCase())}
                  placeholder="도착 (BKK)" maxLength={3}
                  className="w-16 bg-transparent text-xs text-center uppercase border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                />
                {AIRPORT_CITY[arrAirport.toUpperCase()] && (
                  <span className="text-[10px] text-[var(--text-muted)]">{AIRPORT_CITY[arrAirport.toUpperCase()]}</span>
                )}
                <input
                  type="time" value={arrTime}
                  onChange={(e) => setArrTime(e.target.value)}
                  className="flex-1 bg-transparent text-xs border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}

          {/* 취소 */}
          <button type="button" onClick={resetForm} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
            취소
          </button>
        </form>
      )}

      {error && (
        <div className="mt-2">
          <p className="text-[11px] text-[#C4564A]">{error}</p>
          {!showManualFields && (
            <button
              type="button"
              onClick={() => setForceManual(true)}
              className="mt-1 text-[11px] text-[var(--accent)] hover:underline"
            >
              수동으로 등록하기
            </button>
          )}
        </div>
      )}
    </BentoCard>
  );
}
