import { useQuery } from '@tanstack/react-query';
import { Terminal, POLLING_INTERVAL } from '@/types';
import { fetchDashboard } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';

export function useDashboard(terminal: Terminal) {
  const { autoRefresh, refreshInterval } = useSettingsStore();

  return useQuery({
    queryKey: ['dashboard', terminal],
    queryFn: () => fetchDashboard(terminal),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 20 * 1000,
  });
}
