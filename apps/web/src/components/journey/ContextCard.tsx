'use client';

import { useEffect, useState } from 'react';
import { getContextCardType } from '@/types/journey';
import type { ContextCardType } from '@/types/journey';
import { useJourneyStore } from '@/stores/journey.store';
import BentoCard from '@/components/bento/BentoCard';

/**
 * '지금, 여기' 어댑티브 카드
 * 시간대 + 실제 여정 데이터를 결합하여 카드 한 장 노출
 */

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}

export default function ContextCard() {
  const [cardType, setCardType] = useState<ContextCardType>('idle');
  const [mounted, setMounted] = useState(false);
  const { items, budget, expenses, visitRecords } = useJourneyStore();

  useEffect(() => {
    setCardType(getContextCardType(new Date().getHours()));
    setMounted(true);
  }, []);

  if (!mounted) return null;

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

  // 다음 방문할 장소 찾기
  const visitedIds = new Set(visitRecords.map((r) => r.itemId));
  const nextPlace = items.find((item) => !visitedIds.has(item.id));

  // 카드 내용 동적 생성
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
            {nextPlace?.place.quietHours && (
              <p className="text-xs text-[var(--text-muted)] mt-3">
                조용한 시간: {nextPlace.place.quietHours}
              </p>
            )}
          </>
        );

      case 'dining':
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

      case 'evening':
        return (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌙</span>
              <span className="bento-label !text-[var(--accent)]">하루 정리</span>
            </div>
            <p className="text-lg font-semibold text-[var(--text-primary)] tracking-tight">
              오늘의 기록
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {visitedCount > 0
                ? `${visitedCount}곳 방문 · 총 ${Math.floor(totalDuration / 60)}시간 ${totalDuration % 60}분`
                : `${items.length}곳 계획됨`}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              {todaySpent > 0
                ? `오늘 사용: ${formatKRW(todaySpent)}원`
                : `전체 예산: ${formatKRW(totalPlanned)}원`}
            </p>
          </>
        );

      default: // idle
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
            {nextPlace?.place.quietHours && (
              <p className="text-xs text-[var(--text-muted)] mt-3">
                조용한 시간: {nextPlace.place.quietHours}
              </p>
            )}
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
