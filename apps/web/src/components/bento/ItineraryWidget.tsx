'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyItem, Place } from '@/types/journey';

/** 일정을 날짜별로 그룹핑 (order 기준, 하루 4~5개 단위) */
function groupByDay(items: JourneyItem[], startDate: string): { day: number; date: string; items: JourneyItem[] }[] {
  if (items.length === 0) return [];

  const ITEMS_PER_DAY = 4;
  const groups: { day: number; date: string; items: JourneyItem[] }[] = [];
  const base = startDate ? new Date(startDate) : new Date();

  for (let i = 0; i < items.length; i += ITEMS_PER_DAY) {
    const dayNum = Math.floor(i / ITEMS_PER_DAY) + 1;
    const dayDate = new Date(base);
    dayDate.setDate(dayDate.getDate() + dayNum - 1);

    groups.push({
      day: dayNum,
      date: dayDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
      items: items.slice(i, i + ITEMS_PER_DAY),
    });
  }

  return groups;
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🍽️', cafe: '☕', attraction: '📸', shopping: '🛍️',
  hotel: '🏨', transport: '🚌', activity: '🎯', default: '📍',
};

export default function ItineraryWidget() {
  const { items, departureDate, addItem, removeItem, moveItem } = useJourneyStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('attraction');
  const [newMins, setNewMins] = useState('60');

  const days = groupByDay(items, departureDate);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const place: Place = {
      id: `pl-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      estimatedMinutes: parseInt(newMins) || 60,
    };
    const item: JourneyItem = {
      id: `it-${Date.now()}`,
      place,
      order: items.length,
    };
    addItem(item);
    setNewName('');
    setShowAdd(false);
  };

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">여행 일정</p>
        <span className="text-[11px] text-[var(--text-muted)]">
          {items.length}곳
        </span>
      </div>

      {/* 비어있을 때 */}
      {items.length === 0 && !showAdd && (
        <div className="text-center py-4">
          <p className="text-xs text-[var(--text-muted)] mb-3">
            가고 싶은 장소를 추가해보세요
          </p>
        </div>
      )}

      {/* 일별 타임라인 */}
      {days.length > 0 && (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.day}>
              {/* Day 헤더 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold text-[var(--accent)] bg-[var(--accent)]/8 px-2 py-0.5 rounded-full">
                  DAY {day.day}
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">{day.date}</span>
              </div>

              {/* 장소 목록 */}
              <ul className="space-y-1.5 ml-1">
                {day.items.map((item, idx) => {
                  const icon = CATEGORY_ICONS[item.place.category || 'default'] || CATEGORY_ICONS.default;
                  return (
                    <li key={item.id} className="flex items-center gap-2.5 group">
                      {/* 타임라인 라인 */}
                      <div className="flex flex-col items-center w-4 flex-shrink-0">
                        <span className="text-[10px]">{icon}</span>
                        {idx < day.items.length - 1 && (
                          <div className="w-px h-4 bg-[var(--border)] mt-0.5" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[13px] text-[var(--text-primary)] truncate">
                          {item.place.name}
                        </span>
                        {item.place.estimatedMinutes && (
                          <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">
                            {item.place.estimatedMinutes}분
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="
                          w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                          text-[var(--text-muted)] opacity-0 group-hover:opacity-100
                          hover:text-[#C4564A] transition-all duration-150
                        "
                        aria-label="삭제"
                      >
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 장소 추가 */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="
            mt-3 w-full py-2 rounded-xl border border-dashed border-[var(--border)]
            text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]
            hover:border-[var(--accent)] transition-all duration-200
          "
        >
          + 장소 추가
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="장소 이름"
            className="
              w-full bg-transparent text-xs text-[var(--text-primary)]
              border-b border-[var(--border)] pb-1
              focus:outline-none focus:border-[var(--accent)]
              placeholder:text-[var(--text-muted)]
            "
            autoFocus
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="
                flex-1 bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
              "
            >
              <option value="attraction">관광</option>
              <option value="food">식당</option>
              <option value="cafe">카페</option>
              <option value="shopping">쇼핑</option>
              <option value="hotel">숙소</option>
              <option value="activity">액티비티</option>
              <option value="transport">이동</option>
            </select>
            <input
              type="number"
              value={newMins}
              onChange={(e) => setNewMins(e.target.value)}
              placeholder="분"
              className="
                w-16 bg-transparent text-xs text-[var(--text-primary)] text-right
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
                placeholder:text-[var(--text-muted)]
              "
            />
            <span className="text-[10px] text-[var(--text-muted)] self-end pb-1">분</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-[11px] text-[var(--text-muted)] px-2 py-1"
            >
              취소
            </button>
            <button
              type="submit"
              className="text-[11px] text-[var(--accent)] font-medium hover:underline px-2 py-1"
            >
              추가
            </button>
          </div>
        </form>
      )}

      {/* 프리미엄 힌트 */}
      {items.length >= 3 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <button className="
            w-full py-2 rounded-xl text-[11px] font-medium
            bg-[var(--accent)]/8 text-[var(--accent)]
            hover:bg-[var(--accent)]/15 transition-all duration-200
          ">
            AI로 일정 최적화하기 →
          </button>
        </div>
      )}
    </BentoCard>
  );
}
