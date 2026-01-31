'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { ChecklistItem } from '@/types/journey';

export default function ScheduleWidget() {
  const { checklist, toggleChecklist, addChecklistItem, removeChecklistItem, resetChecklist } = useJourneyStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newTime, setNewTime] = useState('');

  const doneCount = checklist.filter((i) => i.done).length;
  const progress = checklist.length > 0 ? Math.round((doneCount / checklist.length) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const item: ChecklistItem = {
      id: Date.now().toString(),
      time: newTime.trim() || '',
      label: newLabel.trim(),
      done: false,
    };
    addChecklistItem(item);
    setNewLabel('');
    setNewTime('');
    setShowAdd(false);
  };

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-4">
        <p className="bento-label">출국 체크리스트</p>
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

      {/* Progress bar */}
      <div className="w-full h-1 bg-[var(--border-light)] rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ul className="space-y-2">
        {checklist.map((item) => (
          <li key={item.id} className="flex items-center gap-3 group">
            <button
              onClick={() => toggleChecklist(item.id)}
              className={`
                w-5 h-5 rounded-full border-2 flex-shrink-0
                flex items-center justify-center transition-all duration-200
                ${item.done
                  ? 'bg-[var(--accent)] border-[var(--accent)]'
                  : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                }
              `}
            >
              {item.done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {item.time && (
                <span className="text-[10px] text-[var(--text-muted)] w-14 flex-shrink-0">{item.time}</span>
              )}
              <span
                className={`text-sm transition-all duration-200 ${
                  item.done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'
                }`}
              >
                {item.label}
              </span>
            </div>
            <button
              onClick={() => removeChecklistItem(item.id)}
              className="
                w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                text-[var(--text-muted)] opacity-0 group-hover:opacity-100
                hover:text-red-400 transition-all duration-150
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

      {/* Add item */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="
            mt-3 w-full py-2 rounded-xl border border-dashed border-[var(--border)]
            text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]
            hover:border-[var(--accent)] transition-all duration-200
          "
        >
          + 항목 추가
        </button>
      ) : (
        <form onSubmit={handleAdd} className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
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
    </BentoCard>
  );
}
