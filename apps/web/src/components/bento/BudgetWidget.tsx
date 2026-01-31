'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { Expense } from '@/types/journey';

const barColors = [
  'bg-[#2C2C2C]',
  'bg-[#8A8578]',
  'bg-[#B8B2A8]',
  'bg-[#E8E4DF]',
];

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}

export default function BudgetWidget() {
  const { budget, expenses, addExpense, removeExpense } = useJourneyStore();
  const [showForm, setShowForm] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expMemo, setExpMemo] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const totalPlanned = budget.reduce((s, c) => s + c.planned, 0);
  const totalSpent = budget.reduce((s, c) => s + c.spent, 0);
  const remaining = totalPlanned - totalSpent;

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(expAmount);
    if (!amount || !expCategory) return;

    const expense: Expense = {
      id: Date.now().toString(),
      categoryId: expCategory,
      amount,
      memo: expMemo || '',
      createdAt: new Date().toISOString(),
    };
    addExpense(expense);
    setExpAmount('');
    setExpMemo('');
    setShowForm(false);
  };

  return (
    <BentoCard>
      <div className="flex items-center justify-between mb-3">
        <p className="bento-label">여행 예산</p>
        {totalSpent > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] text-[var(--accent)] hover:underline"
          >
            {showHistory ? '접기' : `내역 ${expenses.length}건`}
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="flex items-baseline gap-2 mb-1">
        <p className="text-2xl bento-value">{formatKRW(totalPlanned)}원</p>
      </div>
      {totalSpent > 0 && (
        <div className="flex items-center gap-3 text-xs mb-1">
          <span className="text-[var(--text-secondary)]">{formatKRW(totalSpent)}원 사용</span>
          <span className="text-[var(--accent)] font-medium">{formatKRW(remaining)}원 남음</span>
        </div>
      )}

      {/* Stacked bar — planned */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden my-3">
        {budget.map((cat, i) => (
          <div
            key={cat.id}
            className={`${barColors[i % barColors.length]} transition-all duration-500`}
            style={{ width: `${(cat.planned / totalPlanned) * 100}%` }}
          />
        ))}
      </div>

      {/* Spent overlay bar */}
      {totalSpent > 0 && (
        <div className="flex w-full h-1 rounded-full overflow-hidden mb-3 bg-[var(--border-light)]">
          <div
            className="bg-[var(--accent)] rounded-full transition-all duration-500"
            style={{ width: `${Math.min((totalSpent / totalPlanned) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* Category list */}
      <ul className="space-y-1.5">
        {budget.map((cat, i) => (
          <li key={cat.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${barColors[i % barColors.length]}`} />
              <span className="text-xs text-[var(--text-secondary)]">{cat.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {cat.spent > 0 && (
                <span className="text-[10px] text-[var(--accent)]">
                  {formatKRW(cat.spent)}
                </span>
              )}
              <span className="text-xs font-medium text-[var(--text-primary)]">
                {formatKRW(cat.planned)}원
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Expense History */}
      {showHistory && expenses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide">
          {[...expenses].reverse().map((exp) => {
            const cat = budget.find((b) => b.id === exp.categoryId);
            return (
              <div key={exp.id} className="flex items-center justify-between text-[11px] group">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[var(--text-muted)]">{cat?.label}</span>
                  {exp.memo && (
                    <span className="text-[var(--text-secondary)] truncate">{exp.memo}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="font-medium text-[var(--text-primary)]">
                    {exp.amount.toLocaleString()}원
                  </span>
                  <button
                    onClick={() => removeExpense(exp.id)}
                    className="w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add expense form */}
      {!showForm ? (
        <button
          onClick={() => {
            setShowForm(true);
            if (!expCategory && budget.length > 0) setExpCategory(budget[0].id);
          }}
          className="
            mt-3 w-full py-2 rounded-xl border border-dashed border-[var(--border)]
            text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)]
            hover:border-[var(--accent)] transition-all duration-200
          "
        >
          + 지출 기록
        </button>
      ) : (
        <form onSubmit={handleAddExpense} className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
          <div className="flex gap-2">
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="
                flex-1 bg-transparent text-xs text-[var(--text-primary)]
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
              "
            >
              {budget.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={expAmount}
              onChange={(e) => setExpAmount(e.target.value)}
              placeholder="금액"
              className="
                w-24 bg-transparent text-xs text-[var(--text-primary)] text-right
                border-b border-[var(--border)] pb-1
                focus:outline-none focus:border-[var(--accent)]
                placeholder:text-[var(--text-muted)]
              "
              autoFocus
            />
          </div>
          <input
            type="text"
            value={expMemo}
            onChange={(e) => setExpMemo(e.target.value)}
            placeholder="메모 (선택)"
            className="
              w-full bg-transparent text-xs text-[var(--text-primary)]
              border-b border-[var(--border)] pb-1
              focus:outline-none focus:border-[var(--accent)]
              placeholder:text-[var(--text-muted)]
            "
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] px-2 py-1"
            >
              취소
            </button>
            <button
              type="submit"
              className="text-[11px] text-[var(--accent)] font-medium hover:underline px-2 py-1"
            >
              저장
            </button>
          </div>
        </form>
      )}
    </BentoCard>
  );
}
