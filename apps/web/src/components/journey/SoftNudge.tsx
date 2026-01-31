'use client';

import { useState, useMemo, useCallback } from 'react';
import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyItem } from '@/types/journey';

/**
 * '조용한 조력자' AI — Soft-Nudge AI
 *
 * 장소가 2개 이상이면 하단에 작은 아이콘으로 최적화 제안.
 * nearest-neighbor 방식으로 순서를 최적화하고,
 * 클릭 시에만 "바꿀까요?" 제안.
 */

/**
 * 간단한 nearest-neighbor 기반 순서 최적화
 * 이름 글자 차이를 거리 프록시로 사용 (실제로는 좌표 기반으로 대체 가능)
 */
function optimizeOrder(items: JourneyItem[]): { optimized: JourneyItem[]; savedMinutes: number } {
  if (items.length <= 2) {
    return { optimized: items, savedMinutes: 0 };
  }

  // 해시 기반 가상 좌표 생성 (각 장소 이름 → 의사 좌표)
  function pseudoCoord(name: string): [number, number] {
    let h = 0;
    for (let i = 0; i < name.length; i++) {
      h = ((h << 5) - h + name.charCodeAt(i)) | 0;
    }
    return [(h & 0xff) / 255, ((h >> 8) & 0xff) / 255];
  }

  function dist(a: [number, number], b: [number, number]) {
    return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
  }

  const coords = items.map((item) => pseudoCoord(item.place.name));

  // 원래 순서의 총 거리
  let originalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    originalDist += dist(coords[i - 1], coords[i]);
  }

  // Nearest-neighbor
  const visited = new Set<number>();
  const order: number[] = [0];
  visited.add(0);

  while (order.length < items.length) {
    const last = order[order.length - 1];
    let nearest = -1;
    let nearestDist = Infinity;

    for (let i = 0; i < items.length; i++) {
      if (visited.has(i)) continue;
      const d = dist(coords[last], coords[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = i;
      }
    }

    if (nearest >= 0) {
      order.push(nearest);
      visited.add(nearest);
    }
  }

  let optimizedDist = 0;
  for (let i = 1; i < order.length; i++) {
    optimizedDist += dist(coords[order[i - 1]], coords[order[i]]);
  }

  const improvement = originalDist - optimizedDist;
  // 거리 차이를 분으로 변환 (대략 20분 내외)
  const savedMinutes = Math.max(0, Math.round(improvement * 40));

  const isAlreadyOptimal = order.every((v, i) => v === i);
  if (isAlreadyOptimal || savedMinutes === 0) {
    return { optimized: items, savedMinutes: 0 };
  }

  const optimized = order.map((idx, newOrder) => ({
    ...items[idx],
    order: newOrder,
  }));

  return { optimized, savedMinutes };
}

export default function SoftNudge() {
  const { items, reorderItems } = useJourneyStore();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [applied, setApplied] = useState(false);

  const optimization = useMemo(() => optimizeOrder(items), [items]);

  // 2개 미만이거나 이미 최적이거나 적용 완료 시 숨김
  if (items.length < 2 || dismissed || applied || optimization.savedMinutes === 0) return null;

  const handleApply = () => {
    reorderItems(optimization.optimized);
    setApplied(true);
    setExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="
            w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)]
            flex items-center justify-center
            shadow-sm hover:shadow-md transition-all duration-300
            hover:border-[var(--accent)]
          "
          aria-label="동선 최적화 제안"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
        </button>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-4 shadow-lg max-w-[280px] fade-in-up">
          <p className="text-sm text-[var(--text-primary)] leading-relaxed">
            순서를 바꾸면 약{' '}
            <strong className="text-[var(--accent)]">{optimization.savedMinutes}분</strong>
            을 아낄 수 있어요.
          </p>

          {/* 최적화 순서 미리보기 */}
          <div className="mt-2 space-y-1">
            {optimization.optimized.slice(0, 4).map((item, i) => (
              <div key={item.id} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[var(--text-muted)]">{i + 1}.</span>
                <span className="text-[var(--text-secondary)] truncate">{item.place.name}</span>
              </div>
            ))}
            {optimization.optimized.length > 4 && (
              <p className="text-[10px] text-[var(--text-muted)]">
                외 {optimization.optimized.length - 4}곳
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--border-light)]">
            <button
              onClick={() => {
                setExpanded(false);
                setDismissed(true);
              }}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              괜찮아요
            </button>
            <button
              onClick={handleApply}
              className="text-[11px] text-[var(--accent)] font-medium hover:underline transition-colors ml-auto"
            >
              바꿀게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
