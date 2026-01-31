'use client';

import { useState, useRef, useCallback } from 'react';
import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyItem } from '@/types/journey';

/**
 * '비워내기' 계획 모드 — Distraction-free Canvas
 * - 장소 입력 → 분위기 키워드 노출
 * - 삭제 버튼
 * - 드래그 앤 드롭으로 순서 재정렬
 */

const MOOD_DATA: Record<string, { quiet: string; mood: string }> = {
  '카페': { quiet: '오전 10시 이전', mood: '조용히 책 읽기 좋아요' },
  '미술관': { quiet: '평일 오전', mood: '혼자만의 감상 시간' },
  '공원': { quiet: '이른 아침', mood: '산책하며 생각 정리' },
  '시장': { quiet: '오전 11시 전', mood: '한적하게 둘러보기 좋아요' },
  '해변': { quiet: '이른 아침, 해질녘', mood: '파도 소리와 함께' },
  '서점': { quiet: '평일 오후', mood: '천천히 책을 고르기 좋아요' },
  '사찰': { quiet: '이른 아침', mood: '고요한 명상의 시간' },
  '식당': { quiet: '오후 2~5시', mood: '여유로운 한 끼' },
  '박물관': { quiet: '평일 오전', mood: '조용한 관람 시간' },
  '산': { quiet: '이른 새벽', mood: '맑은 공기와 함께' },
  '호텔': { quiet: '체크인 후', mood: '편안한 휴식' },
  '공항': { quiet: '새벽 시간대', mood: '설레는 출발' },
  '바다': { quiet: '이른 아침, 해질녘', mood: '파도 소리와 함께' },
  '절': { quiet: '이른 아침', mood: '고요한 명상의 시간' },
  '호수': { quiet: '이른 아침', mood: '잔잔한 물결 위의 고요' },
  '거리': { quiet: '이른 아침', mood: '한적한 거리 산책' },
  '타워': { quiet: '평일 오전', mood: '탁 트인 전망 감상' },
  '궁': { quiet: '개장 직후', mood: '고즈넉한 산책' },
};

function findMood(name: string) {
  for (const [keyword, data] of Object.entries(MOOD_DATA)) {
    if (name.includes(keyword)) return data;
  }
  return null;
}

export default function CanvasSearch() {
  const [input, setInput] = useState('');
  const [moodInfo, setMoodInfo] = useState<{ quiet: string; mood: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const { addItem, removeItem, items, moveItem } = useJourneyStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const mood = findMood(input);
    const newItem: JourneyItem = {
      id: Date.now().toString(),
      place: {
        id: Date.now().toString(),
        name: input.trim(),
        moodKeyword: mood?.mood,
        quietHours: mood?.quiet,
      },
      order: items.length,
    };

    addItem(newItem);
    setMoodInfo(mood);
    setInput('');

    if (mood) {
      setTimeout(() => setMoodInfo(null), 4000);
    }
  };

  // ── Drag & Drop ──
  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOver.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      moveItem(dragItem.current, dragOver.current);
    }
    dragItem.current = null;
    dragOver.current = null;
  }, [moveItem]);

  return (
    <div className="bento-card">
      <p className="bento-label mb-4">가고 싶은 곳</p>

      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="장소를 툭 던져 넣어보세요"
          className="
            w-full bg-transparent text-[var(--text-primary)] text-sm
            placeholder:text-[var(--text-muted)]
            border-b border-[var(--border)] pb-2
            focus:outline-none focus:border-[var(--accent)]
            transition-colors duration-300
          "
        />
      </form>

      {/* Mood info */}
      {moodInfo && (
        <div className="mt-4 fade-in">
          <p className="text-sm text-[var(--accent)]">{moodInfo.mood}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            조용한 시간: {moodInfo.quiet}
          </p>
        </div>
      )}

      {/* Place list — draggable */}
      {items.length > 0 && (
        <ul className="mt-4 space-y-1">
          {items.map((item, i) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="
                flex items-center gap-2 py-1.5 px-1 -mx-1 rounded-lg
                cursor-grab active:cursor-grabbing
                hover:bg-[var(--border-light)] transition-colors duration-150
                group
              "
            >
              {/* Drag handle */}
              <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <circle cx="5" cy="4" r="1.5" /><circle cx="11" cy="4" r="1.5" />
                  <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                  <circle cx="5" cy="12" r="1.5" /><circle cx="11" cy="12" r="1.5" />
                </svg>
              </span>

              {/* Order number */}
              <span className="w-5 h-5 rounded-full bg-[var(--border-light)] flex items-center justify-center text-[10px] text-[var(--text-muted)] flex-shrink-0">
                {i + 1}
              </span>

              {/* Place name */}
              <span className="text-sm text-[var(--text-primary)] flex-1 min-w-0 truncate">
                {item.place.name}
              </span>

              {/* Mood keyword */}
              {item.place.moodKeyword && (
                <span className="text-[10px] text-[var(--accent)] flex-shrink-0 hidden sm:inline">
                  {item.place.moodKeyword}
                </span>
              )}

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="
                  w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                  text-[var(--text-muted)] opacity-0 group-hover:opacity-100
                  hover:bg-red-50 hover:text-red-400
                  transition-all duration-150
                "
                aria-label="삭제"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Item count */}
      {items.length > 0 && (
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          {items.length}곳 · 드래그하여 순서 변경
        </p>
      )}
    </div>
  );
}
