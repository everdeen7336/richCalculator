import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  JourneyPhase,
  JourneyItem,
  BudgetCategory,
  Expense,
  ChecklistItem,
  VisitRecord,
  FlightInfo,
} from '@/types/journey';
import { DEFAULT_CHECKLIST, PREPARATION_CHECKLIST, generateFlightChecklist, generateArrivalChecklist, migratePhase } from '@/types/journey';

interface JourneyStoreState {
  // ── State ──
  phase: JourneyPhase;
  items: JourneyItem[];
  budget: BudgetCategory[];
  expenses: Expense[];
  checklist: ChecklistItem[];
  visitRecords: VisitRecord[];
  totalBudget: number;
  departureDate: string;
  destination: string;

  // ── Journey Actions ──
  setPhase: (phase: JourneyPhase) => void;
  setDestination: (destination: string) => void;
  setDepartureDate: (date: string) => void;

  // ── Place Actions ──
  addItem: (item: JourneyItem) => void;
  removeItem: (id: string) => void;
  reorderItems: (items: JourneyItem[]) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;

  // ── Budget Actions ──
  updateBudget: (budget: BudgetCategory[]) => void;
  setTotalBudget: (amount: number) => void;
  updateCategoryPlanned: (categoryId: string, amount: number) => void;
  addBudgetCategory: (category: BudgetCategory) => void;
  removeBudgetCategory: (categoryId: string) => void;

  // ── Expense Actions ──
  addExpense: (expense: Expense) => void;
  removeExpense: (expenseId: string) => void;

  // ── Checklist Actions ──
  toggleChecklist: (id: string) => void;
  addChecklistItem: (item: ChecklistItem) => void;
  removeChecklistItem: (id: string) => void;
  resetChecklist: () => void;

  // ── Visit Record Actions ──
  addVisitRecord: (record: VisitRecord) => void;
  updateVisitRecord: (itemId: string, updates: Partial<VisitRecord>) => void;

  // ── Flight Actions ──
  departureFlight: FlightInfo | null;
  returnFlight: FlightInfo | null;
  setDepartureFlight: (flight: FlightInfo) => void;
  setReturnFlight: (flight: FlightInfo) => void;
  clearReturnFlight: () => void;
  clearFlights: () => void;

  // ── Global ──
  reset: () => void;
}

const DEFAULT_BUDGET: BudgetCategory[] = [
  { id: 'flight', label: '항공', planned: 450000, spent: 0 },
  { id: 'hotel', label: '숙소', planned: 320000, spent: 0 },
  { id: 'food', label: '식비', planned: 200000, spent: 0 },
  { id: 'etc', label: '기타', planned: 130000, spent: 0 },
];

function syncBudgetWithExpenses(
  budget: BudgetCategory[],
  expenses: Expense[]
): BudgetCategory[] {
  return budget.map((cat) => ({
    ...cat,
    spent: expenses
      .filter((e) => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0),
  }));
}

export const useJourneyStore = create<JourneyStoreState>()(
  persist(
    (set) => ({
      phase: 'planning',
      items: [],
      budget: DEFAULT_BUDGET,
      expenses: [],
      checklist: PREPARATION_CHECKLIST,
      visitRecords: [],
      totalBudget: 1100000,
      departureDate: '',
      destination: '',
      departureFlight: null,
      returnFlight: null,

      // ── Journey ──
      setPhase: (phase) => set({ phase }),
      setDestination: (destination) => set({ destination }),
      setDepartureDate: (date) => set({ departureDate: date }),

      // ── Places ──
      addItem: (item) =>
        set((s) => ({ items: [...s.items, item] })),
      removeItem: (id) =>
        set((s) => ({
          items: s.items
            .filter((i) => i.id !== id)
            .map((item, idx) => ({ ...item, order: idx })),
        })),
      reorderItems: (items) =>
        set({ items: items.map((item, idx) => ({ ...item, order: idx })) }),
      moveItem: (fromIndex, toIndex) =>
        set((s) => {
          const next = [...s.items];
          const [moved] = next.splice(fromIndex, 1);
          next.splice(toIndex, 0, moved);
          return { items: next.map((item, idx) => ({ ...item, order: idx })) };
        }),

      // ── Budget ──
      updateBudget: (budget) => set({ budget }),
      setTotalBudget: (amount) => set({ totalBudget: amount }),
      updateCategoryPlanned: (categoryId, amount) =>
        set((s) => ({
          budget: s.budget.map((c) =>
            c.id === categoryId ? { ...c, planned: amount } : c
          ),
        })),
      addBudgetCategory: (category) =>
        set((s) => ({ budget: [...s.budget, category] })),
      removeBudgetCategory: (categoryId) =>
        set((s) => ({
          budget: s.budget.filter((c) => c.id !== categoryId),
          expenses: s.expenses.filter((e) => e.categoryId !== categoryId),
        })),

      // ── Expenses ──
      addExpense: (expense) =>
        set((s) => {
          const nextExpenses = [...s.expenses, expense];
          return {
            expenses: nextExpenses,
            budget: syncBudgetWithExpenses(s.budget, nextExpenses),
          };
        }),
      removeExpense: (expenseId) =>
        set((s) => {
          const nextExpenses = s.expenses.filter((e) => e.id !== expenseId);
          return {
            expenses: nextExpenses,
            budget: syncBudgetWithExpenses(s.budget, nextExpenses),
          };
        }),

      // ── Checklist ──
      toggleChecklist: (id) =>
        set((s) => ({
          checklist: s.checklist.map((c) =>
            c.id === id ? { ...c, done: !c.done } : c
          ),
        })),
      addChecklistItem: (item) =>
        set((s) => ({ checklist: [...s.checklist, item] })),
      removeChecklistItem: (id) =>
        set((s) => ({ checklist: s.checklist.filter((c) => c.id !== id) })),
      resetChecklist: () => set({ checklist: PREPARATION_CHECKLIST }),

      // ── Visit Records ──
      addVisitRecord: (record) =>
        set((s) => ({ visitRecords: [...s.visitRecords, record] })),
      updateVisitRecord: (itemId, updates) =>
        set((s) => ({
          visitRecords: s.visitRecords.map((r) =>
            r.itemId === itemId ? { ...r, ...updates } : r
          ),
        })),

      // ── Flights ──
      setDepartureFlight: (flight) =>
        set((s) => {
          // 기존 준비 체크리스트 유지 + 출국 수속 체크리스트 추가
          const prepItems = s.checklist.filter((c) => c.category === 'preparation' || !c.category);
          const depItems = generateFlightChecklist(flight.departure.scheduledTime);
          const arrItems = s.checklist.filter((c) => c.category === 'arrival');
          const checklist = [...prepItems, ...depItems, ...arrItems];
          const destination = flight.arrival.city || s.destination;
          const departureDate = flight.departure.scheduledTime.split('T')[0] || s.departureDate;
          return { departureFlight: flight, checklist, destination, departureDate };
        }),
      setReturnFlight: (flight) =>
        set((s) => {
          // 기존 체크리스트에서 입국 항목 교체
          const nonArrival = s.checklist.filter((c) => c.category !== 'arrival');
          const arrItems = generateArrivalChecklist(flight.arrival.scheduledTime);
          return { returnFlight: flight, checklist: [...nonArrival, ...arrItems] };
        }),
      clearReturnFlight: () =>
        set({ returnFlight: null }),
      clearFlights: () =>
        set({ departureFlight: null, returnFlight: null, checklist: PREPARATION_CHECKLIST }),

      // ── Global ──
      reset: () =>
        set({
          phase: 'planning',
          items: [],
          budget: DEFAULT_BUDGET,
          expenses: [],
          checklist: PREPARATION_CHECKLIST,
          visitRecords: [],
          totalBudget: 1100000,
          departureDate: '',
          destination: '',
          departureFlight: null,
          returnFlight: null,
        }),
    }),
    {
      name: 'journey-storage',
      version: 1,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version === 0 || !version) {
          if (state.phase && typeof state.phase === 'string') {
            state.phase = migratePhase(state.phase);
          }
        }
        return state as unknown as JourneyStoreState;
      },
    }
  )
);
