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
  Accommodation,
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
  updateItem: (id: string, updates: Partial<JourneyItem>) => void;
  updateItemPlace: (id: string, placeUpdates: Partial<import('@/types/journey').Place>) => void;
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
  updateExpense: (expenseId: string, updates: Partial<Pick<Expense, 'amount' | 'memo' | 'categoryId'>>) => void;
  updateCategoryLabel: (categoryId: string, label: string) => void;

  // ── Checklist Actions ──
  toggleChecklist: (id: string) => void;
  addChecklistItem: (item: ChecklistItem) => void;
  removeChecklistItem: (id: string) => void;
  updateChecklistItem: (id: string, updates: Partial<ChecklistItem>) => void;
  resetChecklist: () => void;

  // ── Visit Record Actions ──
  addVisitRecord: (record: VisitRecord) => void;
  updateVisitRecord: (itemId: string, updates: Partial<VisitRecord>) => void;

  // ── Flight Actions ──
  departureFlight: FlightInfo | null;
  returnFlight: FlightInfo | null;
  transitFlights: FlightInfo[];
  setDepartureFlight: (flight: FlightInfo) => void;
  setReturnFlight: (flight: FlightInfo) => void;
  addTransitFlight: (flight: FlightInfo) => void;
  removeTransitFlight: (index: number) => void;
  updateTransitFlight: (index: number, flight: FlightInfo) => void;
  clearDepartureFlight: () => void;
  clearReturnFlight: () => void;
  clearFlights: () => void;

  // ── Accommodation Actions ──
  accommodations: Accommodation[];
  addAccommodation: (acc: Accommodation) => void;
  removeAccommodation: (id: string) => void;
  updateAccommodation: (id: string, updates: Partial<Accommodation>) => void;

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
      transitFlights: [],
      accommodations: [],

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
      updateItem: (id, updates) =>
        set((s) => ({
          items: s.items.map((i) => i.id === id ? { ...i, ...updates } : i),
        })),
      updateItemPlace: (id, placeUpdates) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, place: { ...i.place, ...placeUpdates } } : i
          ),
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

      updateExpense: (expenseId, updates) =>
        set((s) => {
          const nextExpenses = s.expenses.map((e) =>
            e.id === expenseId ? { ...e, ...updates } : e
          );
          return {
            expenses: nextExpenses,
            budget: syncBudgetWithExpenses(s.budget, nextExpenses),
          };
        }),
      updateCategoryLabel: (categoryId, label) =>
        set((s) => ({
          budget: s.budget.map((c) =>
            c.id === categoryId ? { ...c, label } : c
          ),
        })),

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
      updateChecklistItem: (id, updates) =>
        set((s) => ({
          checklist: s.checklist.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
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
      addTransitFlight: (flight) =>
        set((s) => ({ transitFlights: [...s.transitFlights, flight] })),
      removeTransitFlight: (index) =>
        set((s) => ({ transitFlights: s.transitFlights.filter((_, i) => i !== index) })),
      updateTransitFlight: (index, flight) =>
        set((s) => ({
          transitFlights: s.transitFlights.map((f, i) => i === index ? flight : f),
        })),
      clearDepartureFlight: () =>
        set({ departureFlight: null }),
      clearReturnFlight: () =>
        set({ returnFlight: null }),
      clearFlights: () =>
        set({ departureFlight: null, returnFlight: null, transitFlights: [], checklist: PREPARATION_CHECKLIST }),

      // ── Accommodation ──
      addAccommodation: (acc) =>
        set((s) => ({ accommodations: [...s.accommodations, acc] })),
      removeAccommodation: (id) =>
        set((s) => ({ accommodations: s.accommodations.filter((a) => a.id !== id) })),
      updateAccommodation: (id, updates) =>
        set((s) => ({
          accommodations: s.accommodations.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

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
          transitFlights: [],
          accommodations: [],
        }),
    }),
    {
      name: 'journey-storage',
      version: 2, // 1 → 2: 체크리스트 서브카테고리 마이그레이션
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;

        // v0 → v1: phase 마이그레이션
        if (version === 0 || !version) {
          if (state.phase && typeof state.phase === 'string') {
            state.phase = migratePhase(state.phase);
          }
        }

        // v1 → v2: 체크리스트 서브카테고리 마이그레이션
        if (version < 2) {
          const checklist = state.checklist as ChecklistItem[] | undefined;
          if (checklist && Array.isArray(checklist)) {
            // 기존 preparation 체크리스트 ID가 p1~p6인지 확인
            const oldPrepIds = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
            const hasOldFormat = checklist.some(
              (item) => item.category === 'preparation' && oldPrepIds.includes(item.id)
            );

            if (hasOldFormat) {
              // 기존 preparation 항목 중 done 상태인 ID 보존
              const oldDoneIds = new Set(
                checklist
                  .filter((item) => item.category === 'preparation' && item.done)
                  .map((item) => item.id)
              );

              // 새 preparation 체크리스트로 교체 (departure/arrival은 유지)
              const nonPrep = checklist.filter((item) => item.category !== 'preparation');

              // 새 preparation 항목 생성 (기존 done 상태는 유사 항목에 매핑)
              const newPrep = PREPARATION_CHECKLIST.map((item) => {
                // 유사 항목 매핑 (레이블 키워드 기반)
                let isDone = false;
                if (item.label.includes('여권') && oldDoneIds.has('p1')) isDone = true;
                if (item.label.includes('항공편 예약') && oldDoneIds.has('p2')) isDone = true;
                if (item.label.includes('숙소 예약') && oldDoneIds.has('p3')) isDone = true;
                if (item.label.includes('여행자 보험') && oldDoneIds.has('p4')) isDone = true;
                if ((item.label.includes('환전') || item.label.includes('카드')) && oldDoneIds.has('p5')) isDone = true;
                if (item.label.includes('짐') || item.label.includes('의류') || item.label.includes('세면')) {
                  if (oldDoneIds.has('p6')) isDone = true;
                }
                return { ...item, done: isDone };
              });

              state.checklist = [...newPrep, ...nonPrep];
            }
          }
        }

        return state as unknown as JourneyStoreState;
      },
    }
  )
);
