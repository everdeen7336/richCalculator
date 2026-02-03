'use client';

import { useState, useEffect, useCallback } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { FlightInfo } from '@/types/journey';
import { FLIGHT_STATUS_LABEL } from '@/types/journey';

/** 항공사 코드 → 이름 */
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

/** 공항 코드 → 도시명 */
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

/** 인기 목적지 (자동완성용) */
const POPULAR_DESTINATIONS = [
  { name: '도쿄', code: 'NRT', flag: '🇯🇵' },
  { name: '오사카', code: 'KIX', flag: '🇯🇵' },
  { name: '후쿠오카', code: 'FUK', flag: '🇯🇵' },
  { name: '방콕', code: 'BKK', flag: '🇹🇭' },
  { name: '싱가포르', code: 'SIN', flag: '🇸🇬' },
  { name: '홍콩', code: 'HKG', flag: '🇭🇰' },
  { name: '타이베이', code: 'TPE', flag: '🇹🇼' },
  { name: '다낭', code: 'DAD', flag: '🇻🇳' },
  { name: '발리', code: 'DPS', flag: '🇮🇩' },
  { name: '세부', code: 'CEB', flag: '🇵🇭' },
  { name: '괌', code: 'GUM', flag: '🇺🇸' },
  { name: '하와이', code: 'HNL', flag: '🇺🇸' },
  { name: '파리', code: 'CDG', flag: '🇫🇷' },
  { name: '런던', code: 'LHR', flag: '🇬🇧' },
  { name: '뉴욕', code: 'JFK', flag: '🇺🇸' },
];

/** 상태별 스타일 */
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

/** 도착이 다음날인지 확인 */
function isNextDay(depIso: string, arrIso: string): boolean {
  try {
    const d = new Date(depIso).toISOString().split('T')[0];
    const a = new Date(arrIso).toISOString().split('T')[0];
    return a > d;
  } catch { return false; }
}

/** 출발까지 남은 시간 */
function getCountdown(iso: string): string | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return null;
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`;
  return `${minutes}분 남음`;
}

export default function FlightCard() {
  const { departureFlight, setDepartureFlight, clearDepartureFlight, setDepartureDate, setDestination, phase } = useJourneyStore();

  const [depInput, setDepInput] = useState('');
  const [depDate, setDepDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);

  // 입력 모드: 'simple' (날짜+목적지) vs 'detail' (날짜+편명)
  const [inputMode, setInputMode] = useState<'simple' | 'detail'>('simple');
  const [destInput, setDestInput] = useState('');
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  // 과거 날짜 수동 입력 상태
  const [manualDepAirport, setManualDepAirport] = useState('');
  const [manualDepTime, setManualDepTime] = useState('');
  const [manualArrAirport, setManualArrAirport] = useState('');
  const [manualArrTime, setManualArrTime] = useState('');
  const [forceManual, setForceManual] = useState(false);
  const [editBackup, setEditBackup] = useState<FlightInfo | null>(null);

  const isPastDate = depDate ? new Date(depDate + 'T23:59:59') < new Date(new Date().toISOString().split('T')[0] + 'T00:00:00') : false;
  const showManualFields = isPastDate || forceManual;

  // 편명에서 항공사 자동 유추
  const derivedAirline = depInput.length >= 2 ? (AIRLINES[depInput.slice(0, 2)] || '') : '';

  // 목적지 필터링
  const filteredDestinations = destInput.trim()
    ? POPULAR_DESTINATIONS.filter((d) =>
        d.name.toLowerCase().includes(destInput.toLowerCase()) ||
        d.code.toLowerCase().includes(destInput.toLowerCase())
      )
    : POPULAR_DESTINATIONS;

  // 카운트다운 업데이트
  useEffect(() => {
    if (!departureFlight) { setCountdown(null); return; }
    const update = () => setCountdown(getCountdown(departureFlight.departure.scheduledTime));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [departureFlight]);

  // 간편 등록: 날짜 + 목적지만으로 시작
  const registerSimpleFlight = useCallback(() => {
    if (!depDate || !destInput.trim()) return;

    // 목적지에서 공항 코드 찾기
    const dest = POPULAR_DESTINATIONS.find(
      (d) => d.name === destInput || d.code.toUpperCase() === destInput.toUpperCase()
    );
    const destCity = dest?.name || destInput.trim();
    const destCode = dest?.code || '';

    // 가상 항공편 생성 (편명 없이)
    const flight: FlightInfo = {
      flightNumber: '', // 편명 미정
      airline: '',
      departure: {
        airport: 'ICN',
        city: '인천',
        scheduledTime: `${depDate}T00:00:00`,
        terminal: undefined,
        gate: undefined,
      },
      arrival: {
        airport: destCode,
        city: destCity,
        scheduledTime: `${depDate}T00:00:00`,
        terminal: undefined,
      },
      status: 'scheduled',
      durationMinutes: 0,
      source: 'manual',
    };

    setDepartureFlight(flight);
    setDestination(destCity);
    setDepartureDate(depDate);
    GA.flightRegistered('simple', destCity);
    setDestInput('');
    setDepDate('');
  }, [depDate, destInput, setDepartureFlight, setDestination, setDepartureDate]);

  const registerManualFlight = useCallback(() => {
    if (!depInput.trim() || !depDate) return;
    const depCode = manualDepAirport.toUpperCase();
    const arrCode = manualArrAirport.toUpperCase();
    const depDateTime = manualDepTime ? `${depDate}T${manualDepTime}:00` : `${depDate}T00:00:00`;
    let arrDateTime = manualArrTime ? `${depDate}T${manualArrTime}:00` : `${depDate}T00:00:00`;

    // 야간 비행: 도착 시각이 출발보다 이르면 다음날로 처리
    const depMs = new Date(depDateTime).getTime();
    let arrMs = new Date(arrDateTime).getTime();
    if (manualArrTime && manualDepTime && arrMs <= depMs) {
      const nextDay = new Date(new Date(depDate).getTime() + 86400000).toISOString().split('T')[0];
      arrDateTime = `${nextDay}T${manualArrTime}:00`;
      arrMs = new Date(arrDateTime).getTime();
    }
    const duration = depMs && arrMs && arrMs > depMs ? Math.round((arrMs - depMs) / 60000) : 0;

    const airlineCode = depInput.trim().toUpperCase().slice(0, 2);
    const flight: FlightInfo = {
      flightNumber: depInput.trim().toUpperCase(),
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
    setDepartureFlight(flight);
    if (flight.arrival.city) setDestination(flight.arrival.city);
    if (depDate) setDepartureDate(depDate);
    GA.flightRegistered('manual', flight.flightNumber);
    setDepInput('');
    setEditBackup(null);
    setForceManual(false);
  }, [depInput, depDate, manualDepAirport, manualDepTime, manualArrAirport, manualArrTime, setDepartureFlight, setDestination, setDepartureDate]);

  const searchFlight = useCallback(async () => {
    if (!depInput.trim()) return;
    setLoading(true);
    setError('');
    setSuggestion('');

    try {
      const params = new URLSearchParams({ number: depInput.trim() });
      if (depDate) params.set('date', depDate);
      const res = await fetch(`/api/flight?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || '편명을 다시 확인해주세요');
        if (body.suggestion) setSuggestion(body.suggestion);
        setLoading(false);
        return;
      }
      const flight: FlightInfo = await res.json();
      setDepartureFlight(flight);
      if (flight.arrival?.city) setDestination(flight.arrival.city);
      if (flight.departure?.scheduledTime) setDepartureDate(flight.departure.scheduledTime.slice(0, 10));
      GA.flightRegistered('api', flight.flightNumber);
      setDepInput('');
    } catch {
      setError('잠시 후 다시 시도해주세요');
    }
    setLoading(false);
  }, [setDepartureFlight, depInput, depDate]);

  // ── 비행편 미등록 시: 입력 폼 ──
  if (!departureFlight) {
    return (
      <BentoCard>
        <p className="bento-label mb-1">여행 시작하기</p>
        <p className="text-[11px] text-[var(--text-muted)] mb-4">
          {inputMode === 'simple' ? '날짜와 목적지만 입력하면 돼요' : '편명을 입력하면 시간표가 자동 설정돼요'}
        </p>

        {/* 모드 전환 탭 */}
        <div className="flex gap-1 mb-4 p-0.5 bg-[var(--border-light)] rounded-lg">
          <button
            type="button"
            onClick={() => setInputMode('simple')}
            className={`flex-1 text-[11px] py-1.5 rounded-md transition-all ${
              inputMode === 'simple'
                ? 'bg-white text-[var(--text-primary)] font-medium shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            간편 등록
          </button>
          <button
            type="button"
            onClick={() => setInputMode('detail')}
            className={`flex-1 text-[11px] py-1.5 rounded-md transition-all ${
              inputMode === 'detail'
                ? 'bg-white text-[var(--text-primary)] font-medium shadow-sm'
                : 'text-[var(--text-muted)]'
            }`}
          >
            편명으로 등록
          </button>
        </div>

        {/* ── 간편 모드: 날짜 + 목적지 ── */}
        {inputMode === 'simple' && (
          <form onSubmit={(e) => { e.preventDefault(); registerSimpleFlight(); }} className="space-y-3">
            {/* 1. 출발 날짜 */}
            <div>
              <label className="text-[10px] text-[var(--text-muted)] mb-1 block">출발일</label>
              <input
                type="date"
                value={depDate}
                onChange={(e) => setDepDate(e.target.value)}
                className="
                  w-full bg-transparent text-sm text-[var(--text-primary)]
                  border-b border-[var(--border)] pb-1.5
                  focus:outline-none focus:border-[var(--accent)]
                  transition-colors
                "
              />
            </div>

            {/* 2. 목적지 */}
            <div className="relative">
              <label className="text-[10px] text-[var(--text-muted)] mb-1 block">목적지</label>
              <input
                type="text"
                value={destInput}
                onChange={(e) => { setDestInput(e.target.value); setShowDestSuggestions(true); }}
                onFocus={() => setShowDestSuggestions(true)}
                placeholder="예: 도쿄, 방콕, 파리..."
                className="
                  w-full bg-transparent text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)]
                  border-b border-[var(--border)] pb-1.5
                  focus:outline-none focus:border-[var(--accent)]
                  transition-colors
                "
              />

              {/* 목적지 추천 */}
              {showDestSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredDestinations.slice(0, 8).map((dest) => (
                    <button
                      key={dest.code}
                      type="button"
                      onClick={() => {
                        setDestInput(dest.name);
                        setShowDestSuggestions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--border-light)] transition-colors"
                    >
                      <span className="text-sm">{dest.flag}</span>
                      <span className="text-[12px] text-[var(--text-primary)]">{dest.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{dest.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 등록 버튼 */}
            <button
              type="submit"
              disabled={!depDate || !destInput.trim()}
              className="
                w-full py-2.5 rounded-xl text-[12px] font-medium
                bg-[var(--accent)] text-white
                hover:bg-[var(--accent)]/90 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              여행 시작하기 ✈️
            </button>

            <p className="text-[10px] text-[var(--text-muted)] text-center">
              편명은 나중에 추가할 수 있어요
            </p>
          </form>
        )}

        {/* ── 상세 모드: 날짜 + 편명 (API 조회) ── */}
        {inputMode === 'detail' && (
          <form onSubmit={(e) => { e.preventDefault(); showManualFields ? registerManualFlight() : searchFlight(); }} className="space-y-3">
            {/* 1. 출발 날짜 */}
            <div>
              <label className="text-[10px] text-[var(--text-muted)] mb-1 block">출발일</label>
              <input
                type="date"
                value={depDate}
                onChange={(e) => { setDepDate(e.target.value); if (e.target.value) setDepartureDate(e.target.value); }}
                className="
                  w-full bg-transparent text-sm text-[var(--text-primary)]
                  border-b border-[var(--border)] pb-1.5
                  focus:outline-none focus:border-[var(--accent)]
                  transition-colors
                "
              />
            </div>

            {showManualFields && (
              <p className="text-[10px] text-[#B8863A]">
                {forceManual ? '직접 입력할 수 있어요' : '과거 날짜는 직접 입력할 수 있어요'}
              </p>
            )}

            {/* 2. 편명 + 조회/등록 버튼 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={depInput}
                onChange={(e) => setDepInput(e.target.value.toUpperCase())}
                placeholder="편명 (예: KE432)"
                maxLength={7}
                className="
                  flex-1 bg-transparent text-sm text-[var(--text-primary)]
                  placeholder:text-[var(--text-muted)]
                  border-b border-[var(--border)] pb-1.5
                  focus:outline-none focus:border-[var(--accent)]
                  transition-colors uppercase tracking-wider
                "
              />
              <button
                type="submit"
                disabled={loading || (showManualFields && !depInput.trim())}
                className="
                  text-[11px] px-3 py-1.5 rounded-full
                  bg-[var(--text-primary)] text-white
                  hover:bg-[var(--accent)] transition-colors
                  disabled:opacity-50
                "
              >
                {showManualFields ? '등록' : loading ? '조회 중...' : '조회'}
              </button>
              {editBackup && (
                <button
                  type="button"
                  onClick={() => {
                    setDepartureFlight(editBackup);
                    setEditBackup(null);
                    setForceManual(false);
                    setDepInput('');
                    setDepDate('');
                    setManualDepAirport('');
                    setManualArrAirport('');
                    setManualDepTime('');
                    setManualArrTime('');
                  }}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:text-[#C4564A] hover:border-[#C4564A] transition-colors"
                >
                  취소
                </button>
              )}
            </div>

            {/* 3. 과거 날짜: 수동 입력 필드 */}
            {showManualFields && (
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
                      uppercase text-center
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
                      uppercase text-center
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
                    "
                  />
                </div>
              </div>
            )}
          </form>
        )}

        {error && (
          <div className="mt-2">
            <p className="text-[11px] text-[#C4564A]">{error}</p>
            {suggestion && <p className="text-[10px] text-[var(--text-muted)] mt-1">{suggestion}</p>}
            {!showManualFields && inputMode === 'detail' && (
              <button
                type="button"
                onClick={() => setForceManual(true)}
                className="mt-2 text-[11px] text-[var(--accent)] hover:underline"
              >
                수동으로 등록하기
              </button>
            )}
          </div>
        )}
      </BentoCard>
    );
  }

  // ── 비행편 등록됨: 정보 표시 ──
  const dep = departureFlight;
  const statusStyle = STATUS_STYLES[dep.status] || STATUS_STYLES.scheduled;

  // traveling 모드일 때 비행 상태에 따른 제목 변경
  const getFlightTitle = () => {
    if (phase !== 'traveling') return '항공편';
    switch (dep.status) {
      case 'boarding': return '탑승 중 ✈️';
      case 'departed': return '출발 완료';
      case 'in_air': return '비행 중 🌍';
      case 'landed': return '착륙 완료';
      case 'arrived': return '도착 완료';
      case 'delayed': return '지연 안내 ⚠️';
      case 'cancelled': return '취소됨 ⚠️';
      default: return countdown ? '출발 대기' : '항공편';
    }
  };

  return (
    <BentoCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">{getFlightTitle()}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditBackup(dep);
              setDepInput(dep.flightNumber);
              setDepDate(dep.departure.scheduledTime ? dep.departure.scheduledTime.slice(0, 10) : '');
              setManualDepAirport(dep.departure.airport);
              setManualArrAirport(dep.arrival.airport);
              setManualDepTime(dep.departure.scheduledTime?.length >= 16 ? dep.departure.scheduledTime.slice(11, 16) : '');
              setManualArrTime(dep.arrival.scheduledTime?.length >= 16 ? dep.arrival.scheduledTime.slice(11, 16) : '');
              setForceManual(true);
              clearDepartureFlight();
            }}
            className="text-[10px] text-[var(--accent)] hover:underline transition-colors"
          >
            수정
          </button>
          <button
            onClick={clearDepartureFlight}
            className="text-[10px] text-[var(--text-muted)] hover:text-[#C4564A] transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      {/* ── 출국편 ── */}
      <div className="space-y-3">
        {/* Flight number + status (편명이 있을 때만) */}
        {dep.flightNumber ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-wider">
                {dep.flightNumber}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">{dep.airline}</span>
            </div>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
              {FLIGHT_STATUS_LABEL[dep.status] || dep.status}
            </span>
          </div>
        ) : (
          /* 간편 등록 — 편명 추가 유도 */
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[var(--text-muted)]">편명 미등록</span>
            <button
              onClick={() => {
                setInputMode('detail');
                setDepDate(dep.departure.scheduledTime?.slice(0, 10) || '');
                setManualArrAirport(dep.arrival.airport);
                clearDepartureFlight();
              }}
              className="text-[10px] text-[var(--accent)] hover:underline"
            >
              편명 추가하기 →
            </button>
          </div>
        )}

        {/* Route visualization — 간편 등록 시 목적지 강조 */}
        {dep.flightNumber ? (
          <div className="flex items-center gap-3">
            {/* Departure */}
            <div className="text-center min-w-0">
              <p className="text-lg bento-value">{formatTime(dep.departure.scheduledTime)}</p>
              <p className="text-[11px] text-[var(--text-secondary)]">{dep.departure.airport}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{dep.departure.city}</p>
            </div>

            {/* Flight path */}
            <div className="flex-1 flex items-center gap-1 px-1">
              <div className="h-px flex-1 bg-[var(--border)]" />
              <div className="flex flex-col items-center">
                <span className="text-[10px]">✈️</span>
                <span className="text-[9px] text-[var(--text-muted)]">{formatDuration(dep.durationMinutes)}</span>
              </div>
              <div className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {/* Arrival */}
            <div className="text-center min-w-0">
              <p className="text-lg bento-value">
                {formatTime(dep.arrival.scheduledTime)}
                {isNextDay(dep.departure.scheduledTime, dep.arrival.scheduledTime) && (
                  <span className="text-[9px] text-[var(--accent)] align-super ml-0.5">+1</span>
                )}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">{dep.arrival.airport}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{dep.arrival.city}</p>
            </div>
          </div>
        ) : (
          /* 간편 등록 — 목적지 카드 스타일 */
          <div className="flex items-center gap-4 py-2">
            <div className="text-center">
              <p className="text-[11px] text-[var(--text-muted)]">출발</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">{dep.departure.city || '인천'}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[var(--text-muted)]">도착</p>
              <p className="text-lg font-bold text-[var(--accent)]">{dep.arrival.city}</p>
            </div>
          </div>
        )}

        {/* Details row */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{formatDate(dep.departure.scheduledTime)}</span>
          {dep.departure.terminal && <span>터미널 {dep.departure.terminal}</span>}
          {dep.departure.gate && <span>게이트 {dep.departure.gate}</span>}
          {dep.source && dep.source !== 'simulated' && dep.flightNumber && (
            <span className="opacity-40">{dep.source}</span>
          )}
        </div>

        {/* Countdown — traveling 모드에서 강조 */}
        {countdown && (
          <div className={`mt-2 text-center ${phase === 'traveling' ? 'bg-[var(--accent)]/10 rounded-lg py-2' : ''}`}>
            <p className={`font-medium ${phase === 'traveling' ? 'text-[var(--accent)] text-sm' : 'text-[var(--accent)] text-[11px]'}`}>
              {phase === 'traveling' ? `⏱️ ${countdown}` : countdown}
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-[#C4564A] mt-2">{error}</p>}

      {/* 프리미엄 훅 */}
      <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
        <button onClick={() => GA.ctaClicked('flight', '실시간 알림')} className="
          w-full py-2 rounded-xl text-[10px] font-medium
          bg-[var(--accent)]/8 text-[var(--accent)]
          hover:bg-[var(--accent)]/15 transition-all duration-200
        ">
          지연/게이트 변경 실시간 알림 →
        </button>
      </div>
    </BentoCard>
  );
}
