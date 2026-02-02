'use client';

import { useJourneyStore } from '@/stores/journey.store';
import type { JourneyPhase } from '@/types/journey';
import { GA } from '@/lib/analytics';

const PHASES: { key: JourneyPhase; label: string; icon: string }[] = [
  { key: 'planning', label: '계획', icon: '📋' },
  { key: 'traveling', label: '여행 중', icon: '✈️' },
];

export default function PhaseIndicator() {
  const { phase, setPhase } = useJourneyStore();

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {PHASES.map((p) => {
        const isActive = p.key === phase;

        return (
          <button
            key={p.key}
            onClick={() => { setPhase(p.key); GA.phaseSwitched(p.key); }}
            className={`
              text-[11px] sm:text-[12px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-all duration-300 whitespace-nowrap
              ${isActive
                ? 'bg-[var(--text-primary)] text-[#F7F6F3] font-medium shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
              }
            `}
          >
            <span className="mr-1">{p.icon}</span>
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
