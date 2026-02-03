'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { ChecklistItem, ChecklistCategory } from '@/types/journey';

const SECTION_META: Record<ChecklistCategory, { label: string; icon: string }> = {
  preparation: { label: '여행 준비', icon: '🧳' },
  departure: { label: '공항 수속', icon: '✈️' },
  arrival: { label: '입국 절차', icon: '🛬' },
};

/** 카테고리별 그룹핑 */
function groupByCategory(items: ChecklistItem[]): { category: ChecklistCategory; items: ChecklistItem[] }[] {
  const order: ChecklistCategory[] = ['preparation', 'departure', 'arrival'];
  const map = new Map<ChecklistCategory, ChecklistItem[]>();

  for (const item of items) {
    const cat = item.category || 'preparation';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }

  return order.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
}

interface ChecklistSectionProps {
  category: ChecklistCategory;
  items: ChecklistItem[];
  toggleChecklist: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
}

function ChecklistSection({ category, items, toggleChecklist, removeChecklistItem, updateChecklistItem }: ChecklistSectionProps) {
  const meta = SECTION_META[category];
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div className="space-y-2">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{meta.icon}</span>
          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{meta.label}</span>
        </div>
        <span className={`text-[10px] ${allDone ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
          {doneCount}/{items.length}
        </span>
      </div>

      {/* 아이템 */}
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5 group">
            <button
              onClick={() => toggleChecklist(item.id)}
              className={`
                w-4.5 h-4.5 rounded-full border-[1.5px] flex-shrink-0
                flex items-center justify-center transition-all duration-200
                ${item.done
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                }
              `}
              style={{ width: 22, height: 22 }}
            >
              {item.done && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.time && (
                <span className="text-[10px] text-[var(--text-muted)] w-12 flex-shrink-0 tabular-nums">{item.time}</span>
              )}
              <span
                className={`text-[13px] transition-all duration-200 cursor-text rounded px-0.5 -mx-0.5 hover:bg-[var(--border-light)] ${
                  item.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                }`}
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newLabel = e.currentTarget.textContent?.trim();
                  if (newLabel && newLabel !== item.label) {
                    updateChecklistItem(item.id, { label: newLabel });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
                }}
              >
                {item.label}
              </span>
            </div>
            <button
              onClick={() => removeChecklistItem(item.id)}
              className="
                w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
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
        ))}
      </ul>
    </div>
  );
}

export default function ScheduleWidget() {
  const { checklist, toggleChecklist, addChecklistItem, removeChecklistItem, updateChecklistItem, resetChecklist } = useJourneyStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newTime, setNewTime] = useState('');

  const doneCount = checklist.filter((i) => i.done).length;
  const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;
  const groups = groupByCategory(checklist);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const item: ChecklistItem = {
      id: Date.now().toString(),
      time: newTime.trim() || '',
      label: newLabel.trim(),
      done: false,
      category: 'preparation',
    };
    addChecklistItem(item);
    setNewLabel('');
    setNewTime('');
    setShowAdd(false);
  };

  return (
    <BentoCard>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">체크리스트</p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            {doneCount}/{checklist.length}
          </span>
          {doneCount > 0 && doneCount === checklist.length && (
            <button
              onClick={resetChecklist}
              className="text-[10px] text-[var(--accent)] hover:underline"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 전체 진행률 */}
      <div className="w-full h-1 bg-[var(--border-light)] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 카테고리별 섹션 */}
      <div className="space-y-4">
        {groups.map((g) => (
          <ChecklistSection
            key={g.category}
            category={g.category}
            items={g.items}
            toggleChecklist={toggleChecklist}
            removeChecklistItem={removeChecklistItem}
            updateChecklistItem={updateChecklistItem}
          />
        ))}
      </div>

      {/* 항목 추가 */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="
            mt-4 w-full py-2 rounded-xl border border-dashed border-[var(--border)]
            text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]
            hover:border-[var(--accent)] transition-all duration-200
          "
        >
          + 항목 추가
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-4 pt-3 border-t border-[var(--border-light)] space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="시간"
              className="
                w-16 bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
                placeholder:text-[var(--text-muted)]
              "
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="할 일"
              className="
                flex-1 bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
                placeholder:text-[var(--text-muted)]
              "
              autoFocus
            />
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

      {/* 프리미엄 CTA */}
      <div className="mt-4 pt-3 border-t border-[var(--border-light)]">
        <button onClick={() => GA.ctaClicked('schedule', '실시간 알림')} className="
          w-full py-2.5 rounded-xl text-[11px] font-medium
          bg-[var(--accent)]/8 text-[var(--accent)]
          hover:bg-[var(--accent)]/15 transition-all duration-200
        ">
          실시간 항공편 알림 받기 →
        </button>
      </div>
    </BentoCard>
  );
}
