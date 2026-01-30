import { useQuery } from '@tanstack/react-query';
import { Terminal } from '@/types';
import { fetchParking } from '@/lib/api';
import { useSettingsStore } from '@/stores/settings.store';

export function useParking(terminal: Terminal) {
  const { autoRefresh, refreshInterval } = useSettingsStore();

  return useQuery({
    queryKey: ['parking', terminal],
    queryFn: () => fetchParking(terminal),
    refetchInterval: autoRefresh ? refreshInterval : false,
    staleTime: 20 * 1000,
  });
}
