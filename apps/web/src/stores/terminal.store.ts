import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Terminal } from '@/types';

interface TerminalState {
  selectedTerminal: Terminal;
  setTerminal: (terminal: Terminal) => void;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set) => ({
      selectedTerminal: Terminal.T1,
      setTerminal: (terminal) => set({ selectedTerminal: terminal }),
    }),
    {
      name: 'terminal-storage',
    }
  )
);
