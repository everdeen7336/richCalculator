'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { JourneyItem, Place } from '@/types/journey';

/* ── 도시 감지 (CanvasSearch에서 흡수) ── */
const DESTINATION_KEYWORDS = [
  '발리', '방콕', '싱가포르', '호치민', '하노이', '다낭', '세부',
  '보라카이', '푸켓', '치앙마이', '코타키나발루', '쿠알라룸푸르',
  '도쿄', '오사카', '후쿠오카', '삿포로', '교토', '나고야', '오키나와',
  '상하이', '베이징', '홍콩', '타이베이', '마카오',
  '파리', '런던', '로마', '바르셀로나', '프라하', '암스테르담', '뮌헨', '취리히', '이스탄불',
  '뉴욕', '로스앤젤레스', 'LA', '하와이', '샌프란시스코', '시드니', '괌', '사이판',
  '제주', '부산', '서울', '경주', '강릉', '여수',
];

const MOOD_DATA: Record<string, { quiet: string; mood: string }> = {
  '카페': { quiet: '오전 10시 이전', mood: '☕ 조용히 책 읽기 좋아요' },
  '미술관': { quiet: '평일 오전', mood: '🎨 혼자만의 감상 시간' },
  '공원': { quiet: '이른 아침', mood: '🌿 산책하며 생각 정리' },
  '시장': { quiet: '오전 11시 전', mood: '🏪 한적하게 둘러보기 좋아요' },
  '해변': { quiet: '이른 아침, 해질녘', mood: '🏖️ 파도 소리와 함께' },
  '사찰': { quiet: '이른 아침', mood: '🙏 고요한 명상의 시간' },
  '식당': { quiet: '오후 2~5시', mood: '🍽️ 여유로운 한 끼' },
  '박물관': { quiet: '평일 오전', mood: '🏛️ 조용한 관람 시간' },
  '바다': { quiet: '이른 아침, 해질녘', mood: '🌊 파도 소리와 함께' },
  '호수': { quiet: '이른 아침', mood: '🪷 잔잔한 물결 위의 고요' },
  '거리': { quiet: '이른 아침', mood: '🚶 한적한 거리 산책' },
  '타워': { quiet: '평일 오전', mood: '🗼 탁 트인 전망 감상' },
  '궁': { quiet: '개장 직후', mood: '🏯 고즈넉한 산책' },
  '산': { quiet: '이른 새벽', mood: '⛰️ 맑은 공기와 함께' },
};

function findMood(name: string) {
  for (const [keyword, data] of Object.entries(MOOD_DATA)) {
    if (name.includes(keyword)) return data;
  }
  return null;
}

function detectDestination(name: string): string | null {
  for (const city of DESTINATION_KEYWORDS) {
    if (name.includes(city)) return city;
  }
  return null;
}

const CATEGORY_OPTIONS = [
  { value: 'attraction', label: '관광', icon: '📸' },
  { value: 'food', label: '식당', icon: '🍽️' },
  { value: 'cafe', label: '카페', icon: '☕' },
  { value: 'shopping', label: '쇼핑', icon: '🛍️' },
  { value: 'hotel', label: '숙소', icon: '🏨' },
  { value: 'activity', label: '액티비티', icon: '🎯' },
  { value: 'transport', label: '이동', icon: '🚌' },
] as const;

const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((c) => [c.value, c.icon])
);

/** 여행 일수 계산 */
function useTripDays(): number {
  const { departureFlight, returnFlight, departureDate } = useJourneyStore();
  const depTime = departureFlight?.departure?.scheduledTime;
  const retTime = returnFlight?.arrival?.scheduledTime;
  if (depTime && retTime) {
    return Math.max(1, Math.ceil((new Date(retTime).getTime() - new Date(depTime).getTime()) / 86400000));
  }
  return 5; // 기본 5일
}

/** 분 → "1시간 30분" */
function formatMins(m: number): string {
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r > 0 ? `${h}시간 ${r}분` : `${h}시간`;
}

/** items를 DAY별로 그룹핑 */
function groupByDay(items: JourneyItem[], tripDays: number, startDate: string) {
  const groups: Map<number, JourneyItem[]> = new Map();

  // 초기화: 모든 DAY 생성
  for (let d = 1; d <= Math.max(tripDays, 1); d++) {
    groups.set(d, []);
  }

  // 아이템 분배
  items.forEach((item, idx) => {
    const day = item.day || Math.floor(idx / 4) + 1; // 미지정 시 자동 분배
    const d = Math.min(day, tripDays || 999);
    if (!groups.has(d)) groups.set(d, []);
    groups.get(d)!.push(item);
  });

  const base = startDate ? new Date(startDate + 'T00:00:00') : new Date();

  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, dayItems]) => {
      const dayDate = new Date(base);
      dayDate.setDate(dayDate.getDate() + day - 1);
      const totalMins = dayItems.reduce((s, i) => s + (i.place.estimatedMinutes || 60), 0);
      return {
        day,
        date: dayDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
        items: dayItems,
        totalMins,
      };
    })
    .filter((g) => g.items.length > 0 || g.day <= tripDays);
}

export default function ItineraryWidget() {
  const {
    items, departureDate, addItem, removeItem, updateItem, updateItemPlace, moveItem,
    destination, setDestination,
  } = useJourneyStore();
  const tripDays = useTripDays();

  /* ── 상태 ── */
  const [showAdd, setShowAdd] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [moodHint, setMoodHint] = useState<{ quiet: string; mood: string } | null>(null);
  const quickRef = useRef<HTMLInputElement>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('attraction');
  const [newMins, setNewMins] = useState('60');
  const [newDay, setNewDay] = useState('1');
  const [newTime, setNewTime] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editMins, setEditMins] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());
  const [inlineDayAdd, setInlineDayAdd] = useState<number | null>(null);
  const [inlineInput, setInlineInput] = useState('');

  const days = useMemo(
    () => groupByDay(items, tripDays, departureDate),
    [items, tripDays, departureDate]
  );

  /* ── 빠른 추가 (이름만 입력 → Enter) ── */
  const handleQuickAdd = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const name = quickInput.trim();
    if (!name) return;

    // 도시 감지 → destination 자동 설정
    const city = detectDestination(name);
    if (city && city !== destination) {
      setDestination(city);
    }

    // 분위기 키워드 감지
    const mood = findMood(name);
    if (mood) {
      setMoodHint(mood);
      setTimeout(() => setMoodHint(null), 3000);
    }

    const place: Place = {
      id: `pl-${Date.now()}`,
      name,
      category: 'attraction',
      estimatedMinutes: 60,
      moodKeyword: mood?.mood,
      quietHours: mood?.quiet,
    };
    const item: JourneyItem = {
      id: `it-${Date.now()}`,
      place,
      order: items.length,
      day: 1,
    };
    addItem(item);
    setQuickInput('');
  }, [quickInput, destination, setDestination, items.length, addItem]);

  /* ── 상세 추가 ── */
  const handleAdd = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const place: Place = {
      id: `pl-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      estimatedMinutes: parseInt(newMins) || 60,
      address: newAddress.trim() || undefined,
    };
    const item: JourneyItem = {
      id: `it-${Date.now()}`,
      place,
      order: items.length,
      day: parseInt(newDay) || 1,
      startTime: newTime || undefined,
      memo: newMemo.trim() || undefined,
    };
    addItem(item);
    setNewName('');
    setNewMemo('');
    setNewAddress('');
    setShowAdd(false);
  }, [newName, newCategory, newMins, newDay, newTime, newMemo, newAddress, items.length, addItem]);

  /* ── 편집 시작 ── */
  const startEdit = useCallback((item: JourneyItem) => {
    setEditingId(item.id);
    setEditName(item.place.name);
    setEditCategory(item.place.category || 'attraction');
    setEditMins((item.place.estimatedMinutes || 60).toString());
    setEditDay((item.day || 1).toString());
    setEditTime(item.startTime || '');
    setEditMemo(item.memo || '');
    setEditAddress(item.place.address || '');
  }, []);

  /* ── 편집 저장 ── */
  const saveEdit = useCallback(() => {
    if (!editingId || !editName.trim()) { setEditingId(null); return; }
    updateItemPlace(editingId, {
      name: editName.trim(),
      category: editCategory,
      estimatedMinutes: parseInt(editMins) || 60,
      address: editAddress.trim() || undefined,
    });
    updateItem(editingId, {
      day: parseInt(editDay) || 1,
      startTime: editTime || undefined,
      memo: editMemo.trim() || undefined,
    });
    setEditingId(null);
  }, [editingId, editName, editCategory, editMins, editDay, editTime, editMemo, editAddress, updateItem, updateItemPlace]);

  /* ── DAY 인라인 추가 ── */
  const handleInlineAdd = useCallback((day: number) => {
    const name = inlineInput.trim();
    if (!name) { setInlineDayAdd(null); return; }
    const mood = findMood(name);
    if (mood) { setMoodHint(mood); setTimeout(() => setMoodHint(null), 3000); }
    const city = detectDestination(name);
    if (city && city !== destination) setDestination(city);
    const place: Place = {
      id: `pl-${Date.now()}`, name, category: 'attraction', estimatedMinutes: 60,
      moodKeyword: mood?.mood, quietHours: mood?.quiet,
    };
    const item: JourneyItem = { id: `it-${Date.now()}`, place, order: items.length, day };
    addItem(item);
    GA.itineraryAdded(name);
    setInlineInput('');
    setInlineDayAdd(null);
  }, [inlineInput, destination, setDestination, items.length, addItem]);

  /* ── DAY 접기/펼치기 ── */
  const toggleDay = (day: number) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  /* ── 아이템 전체 인덱스 찾기 (순서 이동용) ── */
  const getGlobalIndex = (itemId: string) => items.findIndex((i) => i.id === itemId);

  /* ── 드래그 & 드롭 ── */
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const dragItemId = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);

  const handleDragStart = useCallback((globalIdx: number, itemId: string) => {
    dragItem.current = globalIdx;
    dragItemId.current = itemId;
    setDraggingId(itemId);
  }, []);

  const handleDragEnter = useCallback((globalIdx: number) => {
    dragOver.current = globalIdx;
    setDropTargetDay(null);
  }, []);

  const handleDayDragEnter = useCallback((day: number) => {
    dragOver.current = null;
    setDropTargetDay(day);
  }, []);

  const handleDragEnd = useCallback(() => {
    const id = dragItemId.current;

    // DAY 헤더에 드롭 → 해당 DAY로 이동
    if (id && dropTargetDay !== null) {
      updateItem(id, { day: dropTargetDay });
    }
    // 아이템 위에 드롭 → 순서 변경
    else if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      // 드롭 대상 아이템의 DAY도 가져와서 같이 변경
      const targetItem = items[dragOver.current];
      if (targetItem && targetItem.day !== items[dragItem.current]?.day) {
        updateItem(id!, { day: targetItem.day || 1 });
      }
      moveItem(dragItem.current, dragOver.current);
    }

    dragItem.current = null;
    dragOver.current = null;
    dragItemId.current = null;
    setDraggingId(null);
    setDropTargetDay(null);
  }, [moveItem, updateItem, items, dropTargetDay]);

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">여행 일정</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--text-muted)]">{items.length}곳</span>
          {tripDays > 0 && (
            <span className="text-[10px] text-[var(--text-muted)]">{tripDays}일</span>
          )}
        </div>
      </div>

      {/* 비어있을 때 — 클릭으로 입력 포커스 */}
      {items.length === 0 && !showAdd && (
        <button
          onClick={() => quickRef.current?.focus()}
          className="w-full text-center py-4 hover:bg-[var(--bg-secondary)]/30 rounded-xl transition-colors"
        >
          <p className="text-xs text-[var(--text-muted)] mb-1">+ 가고 싶은 장소를 추가해보세요</p>
          <p className="text-[10px] text-[var(--text-muted)]">DAY별로 일정을 관리할 수 있어요</p>
        </button>
      )}

      {/* 일별 타임라인 */}
      {days.length > 0 && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {days.map((dayGroup) => {
            const collapsed = collapsedDays.has(dayGroup.day);
            return (
              <div key={dayGroup.day}>
                {/* Day 헤더 행 */}
                <div
                  className={`flex items-center gap-2 mb-2 group rounded-lg px-1 py-0.5 -mx-1 transition-all ${dropTargetDay === dayGroup.day && draggingId ? 'bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/40' : ''}`}
                >
                  <button
                    onClick={() => toggleDay(dayGroup.day)}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={() => handleDayDragEnter(dayGroup.day)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex-shrink-0 ${dropTargetDay === dayGroup.day && draggingId ? 'text-white bg-[var(--accent)]' : 'text-[var(--accent)] bg-[var(--accent)]/8'}`}>
                      DAY {dayGroup.day}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">{dayGroup.date}</span>
                    {dropTargetDay === dayGroup.day && draggingId && (
                      <span className="text-[9px] text-[var(--accent)] font-medium">여기에 놓기</span>
                    )}
                    {dayGroup.items.length > 0 && !(dropTargetDay === dayGroup.day && draggingId) && (
                      <span className="text-[9px] text-[var(--text-muted)] ml-auto">
                        {dayGroup.items.length}곳 · {formatMins(dayGroup.totalMins)}
                        {dayGroup.totalMins > 480 && ' ⚠️'}
                      </span>
                    )}
                    <span className="text-[9px] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      {collapsed ? '▼' : '▲'}
                    </span>
                  </button>
                  {/* DAY 인라인 추가 버튼 */}
                  <button
                    onClick={() => { setInlineDayAdd(inlineDayAdd === dayGroup.day ? null : dayGroup.day); setInlineInput(''); }}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 w-7 h-7 flex items-center justify-center"
                    title={`DAY ${dayGroup.day}에 장소 추가`}
                  >＋</button>
                </div>

                {/* 장소 목록 */}
                {!collapsed && (
                  <ul className="space-y-1 ml-1">
                    {dayGroup.items.map((item, idx) => {
                      const icon = CATEGORY_ICONS[item.place.category || ''] || '📍';
                      const globalIdx = getGlobalIndex(item.id);

                      /* ── 편집 모드 ── */
                      if (editingId === item.id) {
                        return (
                          <li key={item.id} className="bg-[var(--bg-secondary)]/50 rounded-xl p-2.5 space-y-2">
                            <div className="flex gap-2">
                              <input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="flex-1 text-xs bg-transparent border-b border-[var(--accent)] pb-0.5 focus:outline-none text-[var(--text-primary)]"
                                autoFocus
                              />
                              <select
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="bg-transparent text-[10px] border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                              >
                                {CATEGORY_OPTIONS.map((c) => (
                                  <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2 items-center">
                              <label className="text-[9px] text-[var(--text-muted)]">DAY</label>
                              <select
                                value={editDay}
                                onChange={(e) => setEditDay(e.target.value)}
                                className="bg-transparent text-[10px] border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] w-10"
                              >
                                {Array.from({ length: Math.max(tripDays, 10) }, (_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                              <label className="text-[9px] text-[var(--text-muted)]">시간</label>
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="bg-transparent text-[10px] border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                              />
                              <label className="text-[9px] text-[var(--text-muted)]">소요</label>
                              <input
                                type="number"
                                value={editMins}
                                onChange={(e) => setEditMins(e.target.value)}
                                className="w-10 bg-transparent text-[10px] text-right border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)]"
                              />
                              <span className="text-[9px] text-[var(--text-muted)]">분</span>
                            </div>
                            <input
                              value={editAddress}
                              onChange={(e) => setEditAddress(e.target.value)}
                              placeholder="주소 (선택)"
                              className="w-full text-[10px] bg-transparent border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                            />
                            <input
                              value={editMemo}
                              onChange={(e) => setEditMemo(e.target.value)}
                              placeholder="메모 (선택)"
                              className="w-full text-[10px] bg-transparent border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)] placeholder:text-[var(--text-muted)]"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingId(null)} className="text-[10px] text-[var(--text-muted)]">취소</button>
                              <button onClick={saveEdit} className="text-[10px] text-[var(--accent)] font-medium">저장</button>
                            </div>
                          </li>
                        );
                      }

                      /* ── 일반 표시 ── */
                      return (
                        <li
                          key={item.id}
                          draggable
                          onDragStart={() => handleDragStart(globalIdx, item.id)}
                          onDragEnter={() => handleDragEnter(globalIdx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          className={`flex items-start gap-2 group hover:bg-[var(--bg-secondary)]/30 rounded-lg px-1 py-0.5 -mx-1 transition-all cursor-grab active:cursor-grabbing ${draggingId === item.id ? 'opacity-40 scale-95' : ''}`}
                        >
                          {/* 드래그 핸들 + 아이콘 */}
                          <div className="flex flex-col items-center w-4 flex-shrink-0 pt-0.5">
                            <span className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                                <circle cx="5" cy="4" r="1.2" /><circle cx="11" cy="4" r="1.2" />
                                <circle cx="5" cy="8" r="1.2" /><circle cx="11" cy="8" r="1.2" />
                                <circle cx="5" cy="12" r="1.2" /><circle cx="11" cy="12" r="1.2" />
                              </svg>
                            </span>
                            <span className="text-[10px]">{icon}</span>
                            {idx < dayGroup.items.length - 1 && (
                              <div className="w-px h-4 bg-[var(--border)] mt-0.5" />
                            )}
                          </div>

                          {/* 내용 */}
                          <div
                            className="flex-1 min-w-0 cursor-pointer"
                            onDoubleClick={() => startEdit(item)}
                            title="더블클릭으로 수정"
                          >
                            <div className="flex items-center gap-1.5">
                              {item.startTime && (
                                <span className="text-[10px] text-[var(--accent)] tabular-nums font-medium">{item.startTime}</span>
                              )}
                              <span className="text-[12px] text-[var(--text-primary)] truncate">{item.place.name}</span>
                              {item.place.estimatedMinutes && (
                                <span className="text-[9px] text-[var(--text-muted)] flex-shrink-0">{item.place.estimatedMinutes}분</span>
                              )}
                            </div>
                            {(item.memo || item.place.address) && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.place.address && (
                                  <a
                                    href={`https://www.google.com/maps/search/${encodeURIComponent(item.place.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-[var(--accent)] hover:underline truncate pointer-events-auto"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    📍 {item.place.address}
                                  </a>
                                )}
                                {item.memo && (
                                  <span className="text-[9px] text-[var(--text-muted)] truncate">{item.memo}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 액션 버튼 */}
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button
                              onClick={() => startEdit(item)}
                              className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)] w-7 h-7 flex items-center justify-center"
                            >✎</button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-[9px] text-[var(--text-muted)] hover:text-[#C4564A] w-7 h-7 flex items-center justify-center"
                            >×</button>
                          </div>
                        </li>
                      );
                    })}

                    {/* 이 DAY에 빈 상태 — 클릭으로 인라인 추가 */}
                    {dayGroup.items.length === 0 && inlineDayAdd !== dayGroup.day && (
                      <li>
                        <button
                          onClick={() => { setInlineDayAdd(dayGroup.day); setInlineInput(''); }}
                          className="text-[10px] text-[var(--text-muted)] italic py-1 ml-6 hover:text-[var(--accent)] transition-colors"
                        >
                          + 장소를 추가해보세요
                        </button>
                      </li>
                    )}

                    {/* DAY 인라인 입력 */}
                    {inlineDayAdd === dayGroup.day && (
                      <li>
                        <form
                          onSubmit={(e) => { e.preventDefault(); handleInlineAdd(dayGroup.day); }}
                          className="flex items-center gap-1.5 ml-5 mt-1"
                        >
                          <input
                            type="text"
                            value={inlineInput}
                            onChange={(e) => setInlineInput(e.target.value)}
                            placeholder={`DAY ${dayGroup.day}에 추가할 장소`}
                            className="flex-1 bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--accent)] pb-0.5 focus:outline-none placeholder:text-[var(--text-muted)]"
                            autoFocus
                          />
                          <button type="submit" className="text-[10px] text-[var(--accent)] font-medium px-1">추가</button>
                          <button type="button" onClick={() => setInlineDayAdd(null)} className="text-[10px] text-[var(--text-muted)] px-1">취소</button>
                        </form>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── 빠른 입력 (항상 표시) ── */}
      <form onSubmit={handleQuickAdd} className="mt-3 relative">
        <input
          ref={quickRef}
          type="text"
          value={quickInput}
          onChange={(e) => setQuickInput(e.target.value)}
          placeholder="장소를 입력하고 Enter (예: 센소지, 오사카 카페)"
          className="w-full bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5 pr-14 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)] transition-colors"
        />
        <div className="absolute right-0 bottom-1.5 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="text-[9px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            title="상세 입력"
          >
            상세
          </button>
        </div>
      </form>

      {/* 분위기 힌트 */}
      {moodHint && (
        <div className="mt-1.5 fade-in">
          <p className="text-[11px] text-[var(--accent)]">{moodHint.mood}</p>
          <p className="text-[9px] text-[var(--text-muted)]">조용한 시간: {moodHint.quiet}</p>
        </div>
      )}

      {/* ── 상세 추가 폼 (토글) ── */}
      {showAdd && (
        <form onSubmit={handleAdd} className="mt-2 pt-2 border-t border-[var(--border-light)] space-y-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="장소 이름"
            className="w-full bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          <div className="flex gap-2 items-center">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)]"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.icon} {c.label}</option>
              ))}
            </select>
            <label className="text-[9px] text-[var(--text-muted)]">DAY</label>
            <select
              value={newDay}
              onChange={(e) => setNewDay(e.target.value)}
              className="bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] w-10"
            >
              {Array.from({ length: Math.max(tripDays, 10) }, (_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)]"
            />
            <input
              type="number"
              value={newMins}
              onChange={(e) => setNewMins(e.target.value)}
              placeholder="소요"
              className="w-14 bg-transparent text-xs text-right text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
            />
            <span className="text-[10px] text-[var(--text-muted)]">분</span>
          </div>
          <input
            type="text"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder="주소 (선택 — 구글맵 연결)"
            className="w-full bg-transparent text-[11px] text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
          />
          <input
            type="text"
            value={newMemo}
            onChange={(e) => setNewMemo(e.target.value)}
            placeholder="메모 (선택)"
            className="w-full bg-transparent text-[11px] text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="text-[11px] text-[var(--text-muted)] px-2 py-1">취소</button>
            <button type="submit" className="text-[11px] text-[var(--accent)] font-medium hover:underline px-2 py-1">추가</button>
          </div>
        </form>
      )}

      {/* 프리미엄 힌트 */}
      {items.length >= 3 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          <button onClick={() => GA.ctaClicked('itinerary', 'AI 최적화')} className="w-full py-2 rounded-xl text-[11px] font-medium bg-[var(--accent)]/8 text-[var(--accent)] hover:bg-[var(--accent)]/15 transition-all duration-200">
            AI로 일정 최적화하기 →
          </button>
        </div>
      )}
    </BentoCard>
  );
}
