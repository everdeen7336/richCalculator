import { useQuery } from '@tanstack/react-query';
import { Terminal } from '@/types';
import { fetchForecast } from '@/lib/api';

export function useForecast(terminal: Terminal, date?: string) {
  return useQuery({
    queryKey: ['forecast', terminal, date],
    queryFn: () => fetchForecast(terminal, date),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}
