import { useQuery } from '@tanstack/react-query';
import { Terminal } from '@/types';
import { fetchCongestion } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';

export function useCongestion(terminal: Terminal) {
  const { autoRefresh, refreshInterval } = useSettingsStore();

  return useQuery({
    queryKey: ['congestion', terminal],
    queryFn: () => fetchCongestion(terminal),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 20 * 1000,
  });
}
