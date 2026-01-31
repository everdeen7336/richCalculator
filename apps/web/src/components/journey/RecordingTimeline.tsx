'use client';

import { useState } from 'react';
import BentoCard from '@/components/bento/BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { VisitRecord } from '@/types/journey';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
}

function formatDuration(min: number): string {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
}

export default function RecordingTimeline() {
  const { items, visitRecords, addVisitRecord, budget, expenses } = useJourneyStore();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);

  const visitedIds = new Set(visitRecords.map((r) => r.itemId));
  const totalSpent = budget.reduce((s, c) => s + c.spent, 0);
  const totalPlanned = budget.reduce((s, c) => s + c.planned, 0);
  const totalDuration = visitRecords.reduce((s, r) => s + r.durationMinutes, 0);

  const handleQuickRecord = (itemId: string, placeName: string) => {
    const record: VisitRecord = {
      itemId,
      placeName,
      arrivedAt: new Date().toISOString(),
      durationMinutes: Math.round(30 + Math.random() * 90),
    };
    addVisitRecord(record);
    setActiveItemId(null);
  };

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <BentoCard>
        <div className="text-center py-4">
          <p className="text-3xl mb-3">🗒️</p>
          <p className="text-lg font-semibold text-[var(--text-primary)]">조용한 기록지</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">여행에서 머물렀던 시간들</p>

          {/* Stats row */}
          <div className="flex justify-center gap-6 mt-5">
            <div className="text-center">
              <p className="text-2xl bento-value">{visitRecords.length}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">방문한 곳</p>
            </div>
            <div className="text-center">
              <p className="text-2xl bento-value">{formatDuration(totalDuration)}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">총 시간</p>
            </div>
            <div className="text-center">
              <p className="text-2xl bento-value">{totalSpent > 0 ? `${Math.round(totalSpent / 10000)}만` : '0'}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">사용 금액</p>
            </div>
          </div>
        </div>
      </BentoCard>

      {/* Timeline */}
      <BentoCard>
        <p className="bento-label mb-4">방문 타임라인</p>

        {visitRecords.length > 0 ? (
          <div className="space-y-0">
            {visitRecords.map((record, i) => (
              <div key={record.itemId} className="flex gap-3">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1" />
                  {i < visitRecords.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border)] my-1" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-4 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {record.placeName}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                      {formatTime(record.arrivedAt)}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    {formatDuration(record.durationMinutes)} 머무름
                  </p>
                  {record.memo && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 italic">
                      {record.memo}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">
            아직 기록이 없어요
          </p>
        )}

        {/* Unvisited places — quick record buttons */}
        {items.filter((item) => !visitedIds.has(item.id)).length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
            <p className="text-[10px] text-[var(--text-muted)] mb-2">방문 기록 추가</p>
            <div className="flex flex-wrap gap-1.5">
              {items
                .filter((item) => !visitedIds.has(item.id))
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleQuickRecord(item.id, item.place.name)}
                    className="
                      text-[11px] px-3 py-1.5 rounded-full
                      border border-[var(--border)] text-[var(--text-secondary)]
                      hover:border-[var(--accent)] hover:text-[var(--accent)]
                      transition-all duration-200
                    "
                  >
                    {item.place.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </BentoCard>
    </div>
  );
}
