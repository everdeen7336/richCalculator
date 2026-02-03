'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';
import type { Expense } from '@/types/journey';
import { TRAVEL_CURRENCIES } from '@/types/journey';

/* ── 색상 팔레트 ── */
const CAT_COLORS = [
  { bar: 'bg-[#2C2C2C]', dot: 'bg-[#2C2C2C]', ring: 'ring-[#2C2C2C]/20' },
  { bar: 'bg-[#8A8578]', dot: 'bg-[#8A8578]', ring: 'ring-[#8A8578]/20' },
  { bar: 'bg-[#B8B2A8]', dot: 'bg-[#B8B2A8]', ring: 'ring-[#B8B2A8]/20' },
  { bar: 'bg-[#D4A574]', dot: 'bg-[#D4A574]', ring: 'ring-[#D4A574]/20' },
  { bar: 'bg-[#8BB5A5]', dot: 'bg-[#8BB5A5]', ring: 'ring-[#8BB5A5]/20' },
  { bar: 'bg-[#C49A6C]', dot: 'bg-[#C49A6C]', ring: 'ring-[#C49A6C]/20' },
];

function formatKRW(n: number): string {
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
  } catch { return ''; }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch { return ''; }
}

/** 환율 조회 (간단한 캐시) */
const rateCache: Record<string, { rate: number; ts: number }> = {};

async function fetchRate(from: string): Promise<number | null> {
  if (from === 'KRW') return 1;
  const cached = rateCache[from];
  if (cached && Date.now() - cached.ts < 3600000) return cached.rate;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data.rates?.KRW;
    if (rate) { rateCache[from] = { rate, ts: Date.now() }; return rate; }
    return null;
  } catch { return null; }
}

/** 카테고리 사용률 % */
function usagePercent(spent: number, planned: number): number {
  if (planned <= 0) return 0;
  return Math.round((spent / planned) * 100);
}

export default function BudgetWidget() {
  const {
    budget, expenses, addExpense, removeExpense, updateExpense,
    updateCategoryPlanned, updateCategoryLabel, addBudgetCategory,
    removeBudgetCategory, phase,
  } = useJourneyStore();

  /* ── 상태 ── */
  const [showForm, setShowForm] = useState(false);
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expMemo, setExpMemo] = useState('');
  const [expCurrency, setExpCurrency] = useState('KRW');
  const [convertedPreview, setConvertedPreview] = useState<number | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyView, setHistoryView] = useState<'list' | 'daily'>('list');

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatPlanned, setNewCatPlanned] = useState('');
  const [editingCatLabel, setEditingCatLabel] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  const [editingExp, setEditingExp] = useState<string | null>(null);
  const [editExpAmount, setEditExpAmount] = useState('');
  const [editExpMemo, setEditExpMemo] = useState('');
  const [editExpCategory, setEditExpCategory] = useState('');
  const [editingTotal, setEditingTotal] = useState(false);
  const [editTotalValue, setEditTotalValue] = useState('');

  /* ── 계산 ── */
  const totalPlanned = budget.reduce((s, c) => s + c.planned, 0);
  const totalSpent = budget.reduce((s, c) => s + c.spent, 0);
  const remaining = totalPlanned - totalSpent;
  const overBudget = remaining < 0;

  /* ── 환율 미리보기 ── */
  useEffect(() => {
    if (expCurrency === 'KRW' || !expAmount) { setConvertedPreview(null); return; }
    const amt = parseFloat(expAmount);
    if (!amt) { setConvertedPreview(null); return; }
    let cancelled = false;
    fetchRate(expCurrency).then((rate) => {
      if (!cancelled && rate) setConvertedPreview(Math.round(amt * rate));
    });
    return () => { cancelled = true; };
  }, [expCurrency, expAmount]);

  /* ── 일별 그룹핑 ── */
  const dailyGroups = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const exp of expenses) {
      const day = exp.createdAt.split('T')[0];
      if (!groups[day]) groups[day] = [];
      groups[day].push(exp);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, exps]) => ({
        date,
        label: formatDate(date + 'T00:00:00'),
        total: exps.reduce((s, e) => s + e.amount, 0),
        expenses: exps,
      }));
  }, [expenses]);

  /* ── 지출 등록 ── */
  const handleAddExpense = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = parseFloat(expAmount);
    if (!rawAmount || !expCategory) return;

    let amount = rawAmount;
    let convertedAmount: number | undefined;
    const currency = expCurrency;

    if (currency !== 'KRW') {
      const rate = await fetchRate(currency);
      if (rate) {
        convertedAmount = amount;
        amount = Math.round(rawAmount * rate);
      }
    }

    const expense: Expense = {
      id: Date.now().toString(),
      categoryId: expCategory,
      amount,
      memo: expMemo || '',
      createdAt: new Date().toISOString(),
      ...(currency !== 'KRW' ? { currency, convertedAmount: convertedAmount } : {}),
    };
    addExpense(expense);
    setExpAmount('');
    setExpMemo('');
    setConvertedPreview(null);
    setShowForm(false);
  }, [expAmount, expCategory, expMemo, expCurrency, addExpense]);

  /* ── 카테고리 순서 이동 ── */
  const moveCat = useCallback((fromIdx: number, dir: -1 | 1) => {
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= budget.length) return;
    const next = [...budget];
    [next[fromIdx], next[toIdx]] = [next[toIdx], next[fromIdx]];
    // Use updateBudget to replace entire array
    const { updateBudget } = useJourneyStore.getState();
    updateBudget(next);
  }, [budget]);

  /* ── 통화 심볼 ── */
  const currencySymbol = TRAVEL_CURRENCIES.find((c) => c.code === expCurrency)?.symbol || '';

  // 오늘 지출 계산 (traveling 모드용)
  const todayExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter((exp) => exp.createdAt.startsWith(today));
  }, [expenses]);
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

  // phase에 따라 위젯 제목과 설명 변경
  const widgetTitle = phase === 'traveling' ? '오늘 지출' : '여행 예산';
  const widgetSubtitle = phase === 'traveling'
    ? todayTotal > 0 ? `${formatKRW(todayTotal)}원 사용` : '아직 지출이 없어요'
    : '카테고리별 예산을 설정하세요';

  return (
    <BentoCard>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-1">
        <p className="bento-label">{widgetTitle}</p>
        <div className="flex items-center gap-2">
          {expenses.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[10px] text-[var(--accent)] hover:underline"
            >
              {showHistory ? '접기' : `내역 ${expenses.length}건`}
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mb-3">{widgetSubtitle}</p>

      {/* ── Summary ── */}
      <div className="flex items-baseline gap-2 mb-1">
        {editingTotal ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const val = parseInt(editTotalValue);
              if (val > 0) {
                // 총 예산 변경 시 카테고리 예산을 비율에 맞게 재분배
                const ratio = val / (totalPlanned || 1);
                budget.forEach((cat) => {
                  updateCategoryPlanned(cat.id, Math.round(cat.planned * ratio));
                });
              }
              setEditingTotal(false);
            }}
            className="flex items-baseline gap-1"
          >
            <input
              type="number"
              value={editTotalValue}
              onChange={(e) => setEditTotalValue(e.target.value)}
              className="text-2xl bento-value w-28 bg-transparent border-b-2 border-[var(--accent)] focus:outline-none"
              autoFocus
              onBlur={() => {
                const val = parseInt(editTotalValue);
                if (val > 0) {
                  const ratio = val / (totalPlanned || 1);
                  budget.forEach((cat) => {
                    updateCategoryPlanned(cat.id, Math.round(cat.planned * ratio));
                  });
                }
                setEditingTotal(false);
              }}
            />
            <span className="text-2xl bento-value">원</span>
          </form>
        ) : (
          <button
            onClick={() => { setEditingTotal(true); setEditTotalValue(totalPlanned.toString()); }}
            className="text-2xl bento-value hover:text-[var(--accent)] transition-colors cursor-pointer"
            title="클릭해서 총 예산 수정"
          >
            {formatKRW(totalPlanned)}원
          </button>
        )}
        <span className="text-[10px] text-[var(--text-muted)]">총 예산</span>
      </div>
      {totalSpent > 0 && (
        <div className="flex items-center gap-3 text-xs mb-1">
          <span className="text-[var(--text-secondary)]">{formatKRW(totalSpent)}원 사용</span>
          <span className={`font-medium ${overBudget ? 'text-[#C4564A]' : 'text-[var(--accent)]'}`}>
            {overBudget ? `${formatKRW(Math.abs(remaining))}원 초과 ⚠️` : `${formatKRW(remaining)}원 남음`}
          </span>
        </div>
      )}

      {/* ── Stacked bar — planned ── */}
      <div className="flex w-full h-1.5 rounded-full overflow-hidden my-3">
        {budget.map((cat, i) => (
          <div
            key={cat.id}
            className={`${CAT_COLORS[i % CAT_COLORS.length].bar} transition-all duration-500`}
            style={{ width: `${totalPlanned > 0 ? (cat.planned / totalPlanned) * 100 : 0}%` }}
          />
        ))}
      </div>

      {/* ── Spent overlay bar ── */}
      {totalSpent > 0 && (
        <div className="flex w-full h-1 rounded-full overflow-hidden mb-3 bg-[var(--border-light)]">
          <div
            className={`${overBudget ? 'bg-[#C4564A]' : 'bg-[var(--accent)]'} rounded-full transition-all duration-500`}
            style={{ width: `${Math.min((totalSpent / totalPlanned) * 100, 100)}%` }}
          />
        </div>
      )}

      {/* ── Category list ── */}
      <ul className="space-y-2">
        {budget.map((cat, i) => {
          const pct = usagePercent(cat.spent, cat.planned);
          const isOver = cat.spent > cat.planned;
          const color = CAT_COLORS[i % CAT_COLORS.length];

          return (
            <li key={cat.id} className="group">
              {/* Row 1: label + amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 순서 이동 버튼 */}
                  <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity -mr-0.5">
                    <button
                      onClick={() => moveCat(i, -1)}
                      disabled={i === 0}
                      className="text-[8px] leading-none text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 h-2.5"
                    >▲</button>
                    <button
                      onClick={() => moveCat(i, 1)}
                      disabled={i === budget.length - 1}
                      className="text-[8px] leading-none text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 h-2.5"
                    >▼</button>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                  {editingCatLabel === cat.id ? (
                    <input
                      value={editLabelValue}
                      onChange={(e) => setEditLabelValue(e.target.value)}
                      onBlur={() => {
                        if (editLabelValue.trim()) updateCategoryLabel(cat.id, editLabelValue.trim());
                        setEditingCatLabel(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                        if (e.key === 'Escape') setEditingCatLabel(null);
                      }}
                      className="text-xs text-[var(--text-secondary)] bg-transparent border-b border-[var(--accent)] focus:outline-none w-16"
                      autoFocus
                    />
                  ) : (
                    <span
                      className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--accent)] transition-colors"
                      onDoubleClick={() => { setEditingCatLabel(cat.id); setEditLabelValue(cat.label); }}
                      title="더블클릭으로 이름 수정"
                    >
                      {cat.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {cat.spent > 0 && (
                    <span className={`text-[10px] ${isOver ? 'text-[#C4564A] font-medium' : 'text-[var(--text-muted)]'}`}>
                      {formatKRW(cat.spent)}
                      {isOver && ' ⚠️'}
                    </span>
                  )}
                  <span className="text-[10px] text-[var(--text-muted)]">/</span>
                  {editingCat === cat.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const val = parseInt(editValue);
                        if (val > 0) updateCategoryPlanned(cat.id, val);
                        setEditingCat(null);
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-20 text-xs text-right bg-transparent border-b border-[var(--accent)] pb-0.5 focus:outline-none text-[var(--text-primary)]"
                        autoFocus
                        onBlur={() => {
                          const val = parseInt(editValue);
                          if (val > 0) updateCategoryPlanned(cat.id, val);
                          setEditingCat(null);
                        }}
                      />
                      <span className="text-[10px] text-[var(--text-muted)]">원</span>
                    </form>
                  ) : (
                    <button
                      onClick={() => { setEditingCat(cat.id); setEditValue(cat.planned.toString()); }}
                      className="text-xs font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                      title="클릭해서 예산 수정"
                    >
                      {formatKRW(cat.planned)}원
                    </button>
                  )}
                  <button
                    onClick={() => removeBudgetCategory(cat.id)}
                    className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[#C4564A] transition-all text-[10px]"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Row 2: 개별 프로그레스 바 */}
              {cat.planned > 0 && (
                <div className="flex items-center gap-2 mt-1 ml-6">
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--border-light)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-[#C4564A]' : color.bar}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className={`text-[9px] tabular-nums ${isOver ? 'text-[#C4564A] font-medium' : 'text-[var(--text-muted)]'}`}>
                    {pct}%
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ── 카테고리 추가 ── */}
      {!showAddCat ? (
        <button
          onClick={() => setShowAddCat(true)}
          className="mt-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
        >
          + 카테고리 추가
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCatLabel.trim()) return;
            addBudgetCategory({
              id: `cat-${Date.now()}`,
              label: newCatLabel.trim(),
              planned: parseInt(newCatPlanned) || 100000,
              spent: 0,
            });
            setNewCatLabel(''); setNewCatPlanned(''); setShowAddCat(false);
          }}
          className="mt-2 flex gap-1.5 items-center"
        >
          <input
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="카테고리명"
            className="flex-1 text-[11px] bg-transparent border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          <input
            value={newCatPlanned}
            onChange={(e) => setNewCatPlanned(e.target.value)}
            placeholder="예산"
            type="number"
            className="w-16 text-[11px] text-right bg-transparent border-b border-[var(--border)] pb-0.5 focus:outline-none focus:border-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button type="submit" className="text-[10px] text-[var(--accent)] font-medium">추가</button>
          <button type="button" onClick={() => setShowAddCat(false)} className="text-[10px] text-[var(--text-muted)]">취소</button>
        </form>
      )}

      {/* ── Expense History ── */}
      {showHistory && expenses.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
          {/* 뷰 전환 탭 */}
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setHistoryView('list')}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                historyView === 'list' ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium' : 'text-[var(--text-muted)]'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setHistoryView('daily')}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                historyView === 'daily' ? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium' : 'text-[var(--text-muted)]'
              }`}
            >
              일별
            </button>
          </div>

          {/* 리스트 뷰 */}
          {historyView === 'list' && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
              {[...expenses].reverse().map((exp) => {
                const cat = budget.find((b) => b.id === exp.categoryId);
                if (editingExp === exp.id) {
                  return (
                    <form
                      key={exp.id}
                      onSubmit={(e) => {
                        e.preventDefault();
                        const amt = parseInt(editExpAmount);
                        if (amt > 0) updateExpense(exp.id, {
                          amount: amt,
                          memo: editExpMemo,
                          ...(editExpCategory !== exp.categoryId ? { categoryId: editExpCategory } : {}),
                        });
                        setEditingExp(null);
                      }}
                      className="flex items-center gap-1.5 text-[11px] bg-[var(--bg-secondary)]/50 rounded-lg p-1.5"
                    >
                      <select
                        value={editExpCategory}
                        onChange={(e) => setEditExpCategory(e.target.value)}
                        className="bg-transparent text-[10px] text-[var(--text-muted)] border-b border-[var(--border)] focus:outline-none focus:border-[var(--accent)] max-w-[60px]"
                      >
                        {budget.map((c) => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                      <input
                        value={editExpMemo}
                        onChange={(e) => setEditExpMemo(e.target.value)}
                        placeholder="메모"
                        className="flex-1 min-w-0 bg-transparent border-b border-[var(--border)] focus:outline-none focus:border-[var(--accent)] text-[var(--text-secondary)]"
                      />
                      <input
                        type="number"
                        value={editExpAmount}
                        onChange={(e) => setEditExpAmount(e.target.value)}
                        className="w-16 text-right bg-transparent border-b border-[var(--accent)] focus:outline-none font-medium text-[var(--text-primary)]"
                        autoFocus
                      />
                      <span className="text-[var(--text-muted)]">원</span>
                      <button type="submit" className="text-[var(--accent)] hover:scale-110 transition-transform">✓</button>
                      <button type="button" onClick={() => setEditingExp(null)} className="text-[var(--text-muted)]">✕</button>
                    </form>
                  );
                }
                return (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between text-[11px] group cursor-pointer hover:bg-[var(--bg-secondary)]/50 rounded-lg px-1.5 py-1 -mx-1 transition-colors"
                    onDoubleClick={() => {
                      setEditingExp(exp.id);
                      setEditExpAmount(exp.amount.toString());
                      setEditExpMemo(exp.memo || '');
                      setEditExpCategory(exp.categoryId);
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] text-[var(--text-muted)] tabular-nums flex-shrink-0">
                        {formatTime(exp.createdAt)}
                      </span>
                      <span className="text-[var(--text-muted)] flex-shrink-0">{cat?.label}</span>
                      {exp.memo && (
                        <span className="text-[var(--text-secondary)] truncate">{exp.memo}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {exp.currency && exp.currency !== 'KRW' && (
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {TRAVEL_CURRENCIES.find((c) => c.code === exp.currency)?.symbol}{exp.convertedAmount?.toLocaleString()}
                        </span>
                      )}
                      <span className="font-medium text-[var(--text-primary)]">
                        {exp.amount.toLocaleString()}원
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeExpense(exp.id); }}
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

          {/* 일별 뷰 */}
          {historyView === 'daily' && (
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-hide">
              {dailyGroups.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">{group.label}</span>
                    <span className="text-[10px] font-medium text-[var(--text-primary)]">{formatKRW(group.total)}원</span>
                  </div>
                  <div className="space-y-0.5 ml-2">
                    {group.expenses.map((exp) => {
                      const cat = budget.find((b) => b.id === exp.categoryId);
                      return (
                        <div key={exp.id} className="flex items-center justify-between text-[10px] group">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[var(--text-muted)]">{cat?.label}</span>
                            {exp.memo && <span className="text-[var(--text-secondary)] truncate">{exp.memo}</span>}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[var(--text-primary)]">{exp.amount.toLocaleString()}원</span>
                            <button
                              onClick={() => removeExpense(exp.id)}
                              className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-red-400 transition-all"
                            >×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add expense form ── */}
      {!showForm ? (
        <button
          onClick={() => {
            setShowForm(true);
            if (!expCategory && budget.length > 0) setExpCategory(budget[0].id);
          }}
          className={`
            mt-3 w-full py-2.5 rounded-xl text-[11px] font-medium transition-all duration-200
            ${phase === 'traveling'
              ? 'bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90'
              : 'border border-dashed border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]'
            }
          `}
        >
          {phase === 'traveling' ? '💰 지출 기록하기' : '+ 지출 기록'}
        </button>
      ) : (
        <form onSubmit={handleAddExpense} className="mt-3 pt-3 border-t border-[var(--border-light)] space-y-2">
          <div className="flex gap-2">
            <select
              value={expCategory}
              onChange={(e) => setExpCategory(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)]"
            >
              {budget.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
            <div className="flex items-end gap-1">
              <select
                value={expCurrency}
                onChange={(e) => setExpCurrency(e.target.value)}
                className="bg-transparent text-[10px] text-[var(--text-muted)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] w-12"
              >
                {TRAVEL_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
              <input
                type="number"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="금액"
                className="w-20 bg-transparent text-xs text-[var(--text-primary)] text-right border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
                autoFocus
              />
            </div>
          </div>

          {/* 환율 미리보기 */}
          {convertedPreview && (
            <p className="text-[10px] text-[var(--accent)] text-right">
              ≈ ₩{convertedPreview.toLocaleString()}
            </p>
          )}

          <input
            type="text"
            value={expMemo}
            onChange={(e) => setExpMemo(e.target.value)}
            placeholder="메모 (선택)"
            className="w-full bg-transparent text-xs text-[var(--text-primary)] border-b border-[var(--border)] pb-1 focus:outline-none focus:border-[var(--accent)] placeholder:text-[var(--text-muted)]"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowForm(false); setConvertedPreview(null); }}
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

      {/* ── 프리미엄 훅 ── */}
      <div className="mt-3 pt-3 border-t border-[var(--border-light)]">
        <button onClick={() => GA.ctaClicked('budget', '그룹 정산')} className="
          w-full py-2 rounded-xl text-[10px] font-medium
          bg-[var(--accent)]/8 text-[var(--accent)]
          hover:bg-[var(--accent)]/15 transition-all duration-200
        ">
          그룹 경비 정산하기 →
        </button>
      </div>
    </BentoCard>
  );
}
