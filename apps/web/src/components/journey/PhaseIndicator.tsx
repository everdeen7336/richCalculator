'use client';

import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyPhase } from '@/types/journey';

const PHASES: { key: JourneyPhase; label: string; labelShort: string }[] = [
  { key: 'preparing', label: '준비', labelShort: '준비' },
  { key: 'coordinating', label: '조율', labelShort: '조율' },
  { key: 'onsite', label: '현지', labelShort: '현지' },
  { key: 'recording', label: '기록', labelShort: '기록' },
];

export default function PhaseIndicator() {
  const { phase, setPhase } = useJourneyStore();
  const currentIndex = PHASES.findIndex((p) => p.key === phase);

  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {PHASES.map((p, i) => {
        const isActive = p.key === phase;
        const isPast = i < currentIndex;

        return (
          <button
            key={p.key}
            onClick={() => setPhase(p.key)}
            className={`
              text-[10px] sm:text-[11px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-300 whitespace-nowrap
              ${isActive
                ? 'bg-[var(--text-primary)] text-[#F7F6F3] font-medium shadow-sm'
                : isPast
                  ? 'bg-[var(--accent)]/8 text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }
            `}
          >
            {p.labelShort}
          </button>
        );
      })}
    </div>
  );
}
