'use client';

import { useState, useEffect, useCallback } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { FlightInfo } from '@/types/journey';
import { FLIGHT_STATUS_LABEL } from '@/types/journey';

/** 상태별 스타일 */
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
  const { departureFlight, setDepartureFlight, clearFlights } = useJourneyStore();

  const [depInput, setDepInput] = useState('');
  const [depDate, setDepDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState('');
  const [countdown, setCountdown] = useState<string | null>(null);

  // 카운트다운 업데이트
  useEffect(() => {
    if (!departureFlight) { setCountdown(null); return; }
    const update = () => setCountdown(getCountdown(departureFlight.departure.scheduledTime));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [departureFlight]);

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
        setError(body.error || '조회에 실패했어요');
        if (body.suggestion) setSuggestion(body.suggestion);
        setLoading(false);
        return;
      }
      const flight: FlightInfo = await res.json();
      setDepartureFlight(flight);
      setDepInput('');
    } catch {
      setError('네트워크 오류가 발생했어요');
    }
    setLoading(false);
  }, [setDepartureFlight, depInput, depDate]);

  // ── 비행편 미등록 시: 입력 폼 ──
  if (!departureFlight) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">항공편</p>
        <p className="text-xs text-[var(--text-muted)] mb-4">
          편명과 출발일을 입력하면 시간표가 자동으로 설정돼요
        </p>

        <form onSubmit={(e) => { e.preventDefault(); searchFlight(); }} className="space-y-3">
          {/* 편명 + 조회 버튼 */}
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
                transition-colors duration-300 uppercase tracking-wider
              "
            />
            <button
              type="submit"
              disabled={loading}
              className="
                text-[11px] px-3 py-1.5 rounded-full
                bg-[var(--text-primary)] text-white
                hover:bg-[var(--accent)] transition-colors
                disabled:opacity-50
              "
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>

          {/* 출발 날짜 */}
          <input
            type="date"
            value={depDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDepDate(e.target.value)}
            className="
              w-full bg-transparent text-xs text-[var(--text-primary)]
              border-b border-[var(--border)] pb-1.5
              focus:outline-none focus:border-[var(--accent)]
              transition-colors duration-300
            "
          />
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

  // ── 비행편 등록됨: 정보 표시 ──
  const dep = departureFlight;
  const statusStyle = STATUS_STYLES[dep.status] || STATUS_STYLES.scheduled;

  return (
    <BentoCard>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">항공편</p>
        <button
          onClick={clearFlights}
          className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors"
        >
          초기화
        </button>
      </div>

      {/* ── 출국편 ── */}
      <div className="space-y-3">
        {/* Flight number + status */}
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

        {/* Route visualization */}
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
            <p className="text-lg bento-value">{formatTime(dep.arrival.scheduledTime)}</p>
            <p className="text-[11px] text-[var(--text-secondary)]">{dep.arrival.airport}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{dep.arrival.city}</p>
          </div>
        </div>

        {/* Details row */}
        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
          <span>{formatDate(dep.departure.scheduledTime)}</span>
          {dep.departure.terminal && <span>터미널 {dep.departure.terminal}</span>}
          {dep.departure.gate && <span>게이트 {dep.departure.gate}</span>}
          {dep.source && dep.source !== 'simulated' && (
            <span className="opacity-40">{dep.source}</span>
          )}
          {countdown && (
            <span className="text-[var(--accent)] font-medium ml-auto">{countdown}</span>
          )}
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400 mt-2">{error}</p>}
    </BentoCard>
  );
}
