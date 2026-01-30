'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useTerminalStore } from '@/stores/terminal.store';
import { useDashboard } from '@/hooks/useDashboard';
import { TerminalSelector } from '@/components/terminal/TerminalSelector';
import { ParkingCard } from '@/components/parking/ParkingCard';
import { LastUpdated } from '@/components/common/LastUpdated';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

function ForecastLinkCard() {
  return (
    <Link
      href="/air/congestion/inout"
      className="block bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-1">공항 혼잡도 예측</h3>
          <p className="text-blue-100 text-sm">출입국별 · 노선별 시간대 예상 승객 수 확인</p>
        </div>
        <span className="text-3xl">✈️</span>
      </div>
    </Link>
  );
}

function AirDashboardContent() {
  const { selectedTerminal } = useTerminalStore();
  const { data, isLoading, isError, error, refetch, isFetching } = useDashboard(selectedTerminal);

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">인천공항 대시보드</h1>
        <p className="text-gray-500">실시간 주차장 현황 및 혼잡도 예측</p>
      </header>

      <div className="mb-6">
        <ForecastLinkCard />
      </div>

      <TerminalSelector />

      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {isError && (
        <ErrorMessage
          message={error?.message || '데이터를 불러오는데 실패했습니다'}
          onRetry={() => refetch()}
        />
      )}

      {data?.data && (
        <div className="space-y-6 mt-6">
          <ParkingCard
            parking={data.data.parking}
            isRefreshing={isFetching}
            onRefresh={() => refetch()}
          />

          <LastUpdated
            timestamp={data.data.parking.timestamp}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
        </div>
      )}
    </main>
  );
}

export default function AirDashboardPage() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20 * 1000,
            refetchOnWindowFocus: true,
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AirDashboardContent />
    </QueryClientProvider>
  );
}
