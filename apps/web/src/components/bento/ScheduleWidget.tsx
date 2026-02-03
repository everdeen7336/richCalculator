'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { ChecklistItem, ChecklistCategory, PackingCategory } from '@/types/journey';
import { PACKING_CATEGORY_META } from '@/types/journey';

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

/** preparation 카테고리 내 서브카테고리별 그룹핑 */
function groupByPackingCategory(items: ChecklistItem[]): { packingCategory: PackingCategory; items: ChecklistItem[] }[] {
  const order: PackingCategory[] = ['documents', 'booking', 'finance', 'communication', 'clothing', 'toiletries', 'electronics', 'medical'];
  const map = new Map<PackingCategory, ChecklistItem[]>();

  for (const item of items) {
    const cat = item.packingCategory || 'documents';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }

  return order.filter((c) => map.has(c)).map((c) => ({ packingCategory: c, items: map.get(c)! }));
}

interface ChecklistSectionProps {
  category: ChecklistCategory;
  items: ChecklistItem[];
  toggleChecklist: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
}

/** 개별 체크 아이템 렌더 */
function ChecklistItemRow({
  item,
  toggleChecklist,
  removeChecklistItem,
  updateChecklistItem,
}: {
  item: ChecklistItem;
  toggleChecklist: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
}) {
  return (
    <li className="flex items-center gap-2.5 group">
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
        {item.essential && !item.done && (
          <span className="text-[9px] text-[#C49A6C] bg-[#C49A6C]/10 px-1.5 py-0.5 rounded-full flex-shrink-0">필수</span>
        )}
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
  );
}

/** 서브카테고리 섹션 (preparation 내) */
function PackingSubSection({
  packingCategory,
  items,
  toggleChecklist,
  removeChecklistItem,
  updateChecklistItem,
  isExpanded,
  onToggleExpand,
}: {
  packingCategory: PackingCategory;
  items: ChecklistItem[];
  toggleChecklist: (id: string) => void;
  removeChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const meta = PACKING_CATEGORY_META[packingCategory];
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  return (
    <div className="border-b border-[var(--border-light)] last:border-b-0 pb-2 last:pb-0">
      {/* 서브카테고리 헤더 (접히기 가능) */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between py-1.5 hover:bg-[var(--border-light)]/30 rounded-lg transition-colors -mx-1 px-1"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]">{meta.icon}</span>
          <span className="text-[11px] font-medium text-[var(--text-secondary)]">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] ${allDone ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            {doneCount}/{items.length}
          </span>
          <svg
            className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 아이템 목록 (펼쳐졌을 때만) */}
      {isExpanded && (
        <ul className="space-y-1.5 mt-1 ml-5">
          {items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              toggleChecklist={toggleChecklist}
              removeChecklistItem={removeChecklistItem}
              updateChecklistItem={updateChecklistItem}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ChecklistSection({ category, items, toggleChecklist, removeChecklistItem, updateChecklistItem }: ChecklistSectionProps) {
  const meta = SECTION_META[category];
  const doneCount = items.filter((i) => i.done).length;
  const allDone = doneCount === items.length;

  // preparation일 때 서브카테고리 확장 상태 관리
  const [expandedPacking, setExpandedPacking] = useState<Set<PackingCategory>>(() => {
    // 초기: 미완료 항목이 있는 카테고리만 펼침
    const initial = new Set<PackingCategory>();
    const groups = groupByPackingCategory(items);
    for (const g of groups) {
      if (g.items.some((i) => !i.done)) {
        initial.add(g.packingCategory);
      }
    }
    // 모두 완료면 첫 번째만 펼침
    if (initial.size === 0 && groups.length > 0) {
      initial.add(groups[0].packingCategory);
    }
    return initial;
  });

  const togglePackingExpand = (pc: PackingCategory) => {
    setExpandedPacking((prev) => {
      const next = new Set(prev);
      if (next.has(pc)) next.delete(pc);
      else next.add(pc);
      return next;
    });
  };

  // preparation 카테고리: 서브카테고리별 아코디언
  if (category === 'preparation') {
    const packingGroups = groupByPackingCategory(items);

    return (
      <div className="space-y-1">
        {/* 섹션 헤더 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{meta.icon}</span>
            <span className="text-[11px] font-semibold text-[var(--text-secondary)]">{meta.label}</span>
          </div>
          <span className={`text-[10px] ${allDone ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
            {doneCount}/{items.length}
          </span>
        </div>

        {/* 서브카테고리 아코디언 */}
        <div className="space-y-1 bg-[var(--bg-card)]/50 rounded-xl p-2">
          {packingGroups.map((g) => (
            <PackingSubSection
              key={g.packingCategory}
              packingCategory={g.packingCategory}
              items={g.items}
              toggleChecklist={toggleChecklist}
              removeChecklistItem={removeChecklistItem}
              updateChecklistItem={updateChecklistItem}
              isExpanded={expandedPacking.has(g.packingCategory)}
              onToggleExpand={() => togglePackingExpand(g.packingCategory)}
            />
          ))}
        </div>
      </div>
    );
  }

  // departure/arrival 카테고리: 기존 플랫 리스트
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
          <ChecklistItemRow
            key={item.id}
            item={item}
            toggleChecklist={toggleChecklist}
            removeChecklistItem={removeChecklistItem}
            updateChecklistItem={updateChecklistItem}
          />
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
