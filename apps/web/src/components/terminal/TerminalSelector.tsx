'use client';

import { Terminal, TERMINAL_CONFIG } from '@/types';
import { useTerminalStore } from '@/stores/terminal.store';

export function TerminalSelector() {
  const { selectedTerminal, setTerminal } = useTerminalStore();

  return (
    <div className="flex gap-4 justify-center">
      {Object.values(Terminal).map((terminal) => {
        const config = TERMINAL_CONFIG[terminal];
        const isSelected = selectedTerminal === terminal;

        return (
          <button
            key={terminal}
            onClick={() => setTerminal(terminal)}
            className={`
              flex-1 max-w-xs py-6 px-8 rounded-2xl transition-all duration-300
              border-2 font-bold text-lg
              ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md'
              }
            `}
          >
            <div className="text-2xl mb-1">{terminal}</div>
            <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
              {config.nameKo}
            </div>
          </button>
        );
      })}
    </div>
  );
}
