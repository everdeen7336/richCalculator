'use client';

import { useEffect, useState } from 'react';
import { getContextCardType } from '@/types/journey';
import type { ContextCardType, FlightInfo } from '@/types/journey';
import { FLIGHT_STATUS_LABEL } from '@/types/journey';
import { useJourneyStore } from '@/stores/journey.store';
import BentoCard from '@/components/bento/BentoCard';

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return '--:--'; }
}

function getFlightCountdown(iso: string): { text: string; urgent: boolean } | null {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return null;
  if (hours > 0) return { text: `${hours}시간 ${minutes}분 후 출발`, urgent: hours <= 3 };
  return { text: `${minutes}분 후 출발`, urgent: true };
}

/**
 * 비행편이 등록된 경우 비행 상태 기반 카드를 우선 노출
 */
function FlightContextCard({ flight, type }: { flight: FlightInfo; type: 'departure' | 'return' }) {
  const countdown = type === 'departure' ? getFlightCountdown(flight.departure.scheduledTime) : null;
  const isDeparture = type === 'departure';

  // 출발 임박 (3시간 이내)
  if (isDeparture && countdown?.urgent) {
    return (
      <>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🛫</span>
          <span className="bento-label !text-[var(--accent)]">출발 임박</span>
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
          {flight.flightNumber} · {flight.arrival.city}행
        </p>
        <p className="text-sm text-[var(--accent)] font-medium mt-1">{countdown.text}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
          {flight.departure.terminal && <span>터미널 {flight.departure.terminal}</span>}
          {flight.departure.gate && <span>게이트 {flight.departure.gate}</span>}
          <span>{formatTime(flight.departure.scheduledTime)} 출발</span>
        </div>
      </>
    );
  }

  // 비행 중
  if (flight.status === 'in_air' || flight.status === 'departed') {
    const arrivalTime = new Date(flight.arrival.scheduledTime).getTime();
    const depTime = new Date(flight.departure.scheduledTime).getTime();
    const now = Date.now();
    const progress = Math.min(100, Math.max(0, ((now - depTime) / (arrivalTime - depTime)) * 100));
    const remainMin = Math.max(0, Math.round((arrivalTime - now) / 60000));

    return (
      <>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">✈️</span>
          <span className="bento-label !text-[var(--accent)]">비행 중</span>
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
          {flight.arrival.city}까지 {remainMin > 60 ? `${Math.floor(remainMin / 60)}시간 ${remainMin % 60}분` : `${remainMin}분`}
        </p>

        {/* 비행 프로그레스 바 */}
        <div className="mt-3 mb-2">
          <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
            <span>{flight.departure.city}</span>
            <span>{flight.arrival.city}</span>
          </div>
          <div className="w-full h-1 bg-[var(--border-light)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          도착 예정 {formatTime(flight.arrival.scheduledTime)}
        </p>
      </>
    );
  }

  // 기본: 출발 예정
  if (isDeparture && countdown) {
    return (
      <>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🛫</span>
          <span className="bento-label !text-[var(--accent)]">출발 예정</span>
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
          {flight.flightNumber} · {flight.arrival.city}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{countdown.text}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-[var(--text-muted)]">
          <span>{formatTime(flight.departure.scheduledTime)}</span>
          <span>→</span>
          <span>{formatTime(flight.arrival.scheduledTime)}</span>
          {flight.departure.terminal && <span>· {flight.departure.terminal}</span>}
        </div>
      </>
    );
  }

  return null;
}

export default function ContextCard() {
  const [cardType, setCardType] = useState<ContextCardType>('idle');
  const [mounted, setMounted] = useState(false);
  const { items, budget, expenses, visitRecords, departureFlight, returnFlight } = useJourneyStore();

  useEffect(() => {
    setCardType(getContextCardType(new Date().getHours()));
    setMounted(true);
    // 매 분 카드 타입 갱신
    const id = setInterval(() => setCardType(getContextCardType(new Date().getHours())), 60000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return null;

  // ── 비행편 기반 카드 우선 노출 ──
  if (departureFlight) {
    const depTime = new Date(departureFlight.departure.scheduledTime).getTime();
    const arrTime = new Date(departureFlight.arrival.scheduledTime).getTime();
    const now = Date.now();

    // 출발 24시간 이내이거나 비행 중이면 비행 카드
    if (depTime - now < 24 * 3600000 && depTime - now > 0) {
      return (
        <BentoCard variant="accent" className="fade-in-up">
          <FlightContextCard flight={departureFlight} type="departure" />
        </BentoCard>
      );
    }
    if (now >= depTime && now <= arrTime) {
      return (
        <BentoCard variant="accent" className="fade-in-up">
          <FlightContextCard flight={{ ...departureFlight, status: 'in_air' }} type="departure" />
        </BentoCard>
      );
    }
  }

  // ── 기존 시간대 기반 카드 ──
  const totalSpent = budget.reduce((s, c) => s + c.spent, 0);
  const totalPlanned = budget.reduce((s, c) => s + c.planned, 0);
  const remaining = totalPlanned - totalSpent;
  const visitedCount = visitRecords.length;
  const totalDuration = visitRecords.reduce((s, r) => s + r.durationMinutes, 0);
  const todayExpenses = expenses.filter((e) => {
    const d = new Date(e.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const todaySpent = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const visitedIds = new Set(visitRecords.map((r) => r.itemId));
  const nextPlace = items.find((item) => !visitedIds.has(item.id));

  const renderContent = () => {
    switch (cardType) {
      case 'moving':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🚶</span>
              <span className="bento-label !text-[var(--accent)]">이동 중</span>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              {nextPlace ? `다음은 ${nextPlace.place.name}` : '다음 장소를 추가해보세요'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {nextPlace?.place.estimatedMinutes
                ? `약 ${nextPlace.place.estimatedMinutes}분 소요`
                : nextPlace?.place.moodKeyword || '여유롭게 이동하세요'}
            </p>
          </>
        );
      case 'dining': {
        const diningPlace = items.find(
          (item) => !visitedIds.has(item.id) &&
            (item.place.name.includes('식당') || item.place.name.includes('카페') || item.place.name.includes('맛집'))
        ) || nextPlace;
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🍽️</span>
              <span className="bento-label !text-[var(--accent)]">식사 시간</span>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              {diningPlace ? diningPlace.place.name : '식사할 곳을 저장해보세요'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {diningPlace?.place.moodKeyword || '여유로운 한 끼'}
            </p>
            {todaySpent > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-3">
                오늘 {formatKRW(todaySpent)}원 사용 · {formatKRW(remaining)}원 남음
              </p>
            )}
          </>
        );
      }
      case 'evening':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌙</span>
              <span className="bento-label !text-[var(--accent)]">하루 정리</span>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">오늘의 기록</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {visitedCount > 0
                ? `${visitedCount}곳 방문 · 총 ${Math.floor(totalDuration / 60)}시간 ${totalDuration % 60}분`
                : `${items.length}곳 계획됨`}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              {todaySpent > 0 ? `오늘 사용: ${formatKRW(todaySpent)}원` : `전체 예산: ${formatKRW(totalPlanned)}원`}
            </p>
          </>
        );
      default:
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">☕</span>
              <span className="bento-label !text-[var(--accent)]">여유 시간</span>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              {nextPlace ? nextPlace.place.name : '잠시 쉬어가세요'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {nextPlace?.place.moodKeyword || '지금 이 순간을 즐기세요'}
            </p>
          </>
        );
    }
  };

  return (
    <BentoCard variant="accent" className="fade-in-up">
      {renderContent()}
    </BentoCard>
  );
}
