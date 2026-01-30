import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { POLLING_INTERVAL } from '@/types';

interface SettingsState {
  autoRefresh: boolean;
  refreshInterval: number;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      autoRefresh: true,
      refreshInterval: POLLING_INTERVAL.DEFAULT,
      setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
    }),
    {
      name: 'settings-storage',
    }
  )
);
