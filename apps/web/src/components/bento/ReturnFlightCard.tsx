'use client';

import { useState, useEffect, useCallback } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { FlightInfo } from '@/types/journey';
import { FLIGHT_STATUS_LABEL } from '@/types/journey';

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

  useEffect(() => {
    if (!returnFlight) { setCountdown(null); return; }
    const update = () => setCountdown(getCountdown(returnFlight.departure.scheduledTime));
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [returnFlight]);

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

        <form onSubmit={(e) => { e.preventDefault(); searchFlight(); }} className="space-y-3">
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

          <input
            type="date"
            value={retDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setRetDate(e.target.value)}
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
