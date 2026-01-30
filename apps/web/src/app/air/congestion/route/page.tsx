'use client';

import { useState } from 'react';
import { Terminal, TERMINAL_CONFIG, HourlyRouteData } from '@/types';
import { useForecast } from '@/hooks/useForecast';
import { DateSelector } from '@/components/forecast/DateSelector';
import { CongestionHeatmap } from '@/components/forecast/CongestionHeatmap';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

function getDateRange(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}${m}${day}`);
  }
  return dates;
}

const ROUTE_LABELS: Record<string, { label: string; emoji: string }> = {
  japan: { label: '일본', emoji: '🇯🇵' },
  china: { label: '중국', emoji: '🇨🇳' },
  southeastAsia: { label: '동남아', emoji: '🌴' },
  northAmerica: { label: '미주', emoji: '🇺🇸' },
  europe: { label: '유럽', emoji: '🇪🇺' },
  oceania: { label: '대양주', emoji: '🇦🇺' },
  other: { label: '기타', emoji: '🌍' },
};

const ROUTE_KEYS = ['japan', 'china', 'southeastAsia', 'northAmerica', 'europe', 'oceania', 'other'] as const;

function getRouteColor(key: string): string {
  const colors: Record<string, string> = {
    japan: '#EF4444',
    china: '#F59E0B',
    southeastAsia: '#10B981',
    northAmerica: '#3B82F6',
    europe: '#8B5CF6',
    oceania: '#06B6D4',
    other: '#6B7280',
  };
  return colors[key] || '#6B7280';
}

export default function RouteCongestionPage() {
  const dates = getDateRange();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal>(Terminal.T1);
  const { data, isLoading, isError, error, refetch } = useForecast(selectedTerminal, selectedDate);
  const currentHour = new Date().getHours();

  const forecast = data?.data;
  const routeData = forecast?.routeData || [];

  // Calculate totals per route for the summary cards
  const routeTotals = ROUTE_KEYS.map((key) => ({
    key,
    ...ROUTE_LABELS[key],
    total: routeData.reduce((sum, d) => sum + (d[key] as number), 0),
    peak: routeData.reduce(
      (max, d) => ((d[key] as number) > max.value ? { hour: d.hour, value: d[key] as number } : max),
      { hour: 0, value: 0 }
    ),
  })).sort((a, b) => b.total - a.total);

  const heatmapRows = ROUTE_KEYS.map((key) => ({
    label: `${ROUTE_LABELS[key].emoji} ${ROUTE_LABELS[key].label}`,
    data: routeData.map((d) => ({ hour: d.hour, value: d[key] as number })),
  }));

  // Stacked total per hour for bar display
  const hourlyTotals = routeData.map((d) => ({
    hour: d.hour,
    value: ROUTE_KEYS.reduce((sum, key) => sum + (d[key] as number), 0),
  }));
  const maxHourlyTotal = Math.max(...hourlyTotals.map((h) => h.value), 1);

  return (
    <div className="space-y-5">
      {/* Terminal Selector */}
      <div className="flex gap-3 justify-center">
        {Object.values(Terminal).map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTerminal(t)}
            className={`px-5 py-3 rounded-xl font-bold transition-all border-2 ${
              selectedTerminal === t
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="text-lg">{t}</div>
            <div className={`text-xs ${selectedTerminal === t ? 'text-blue-100' : 'text-gray-400'}`}>
              {TERMINAL_CONFIG[t].nameKo}
            </div>
          </button>
        ))}
      </div>

      {/* Date Selector */}
      <DateSelector dates={dates} selected={selectedDate} onSelect={setSelectedDate} />

      {isLoading && (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {isError && (
        <ErrorMessage
          message={error?.message || '데이터를 불러오는데 실패했습니다'}
          onRetry={() => refetch()}
        />
      )}

      {forecast && routeData.length > 0 && (
        <>
          {/* Route Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {routeTotals.slice(0, 4).map((route) => (
              <div
                key={route.key}
                className="bg-white rounded-xl shadow-md p-3 border-l-4"
                style={{ borderLeftColor: getRouteColor(route.key) }}
              >
                <p className="text-xs text-gray-500">
                  {route.emoji} {route.label}
                </p>
                <p className="text-xl font-bold text-gray-800">
                  {route.total.toLocaleString()}
                  <span className="text-xs font-normal text-gray-400 ml-0.5">명</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-1">
                  피크 {route.peak.hour}시 ({route.peak.value.toLocaleString()}명)
                </p>
              </div>
            ))}
          </div>

          {/* Stacked Hourly Overview */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">시간대별 전체 승객</h3>
            <p className="text-xs text-gray-400 mb-3">모든 노선 합산 출국 예상 승객 수</p>
            <div className="flex items-end gap-[2px] w-full overflow-x-auto px-1">
              {hourlyTotals.map((h) => {
                const heightPercent = Math.max((h.value / maxHourlyTotal) * 100, 2);
                // Color by each route's proportion
                return (
                  <div key={h.hour} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <span className="text-[10px] text-gray-500 tabular-nums">
                      {h.value > 0 ? (h.value >= 1000 ? `${(h.value / 1000).toFixed(1)}k` : h.value) : ''}
                    </span>
                    <div className="w-full h-24 flex items-end justify-center">
                      <div className="w-full max-w-[20px] rounded-t-sm overflow-hidden flex flex-col-reverse">
                        {ROUTE_KEYS.map((key) => {
                          const rd = routeData.find((d) => d.hour === h.hour);
                          const val = rd ? (rd[key] as number) : 0;
                          const pct = maxHourlyTotal > 0 ? (val / maxHourlyTotal) * 100 : 0;
                          return (
                            <div
                              key={key}
                              style={{
                                height: `${pct}%`,
                                backgroundColor: getRouteColor(key),
                                minHeight: val > 0 ? '1px' : 0,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] tabular-nums ${
                        h.hour === currentHour ? 'font-bold text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {h.hour}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3">
              {ROUTE_KEYS.map((key) => (
                <div key={key} className="flex items-center gap-1 text-[10px] text-gray-500">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: getRouteColor(key) }}
                  />
                  {ROUTE_LABELS[key].label}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap */}
          <CongestionHeatmap
            title="노선별 시간대 상세"
            rows={heatmapRows}
            currentHour={currentHour}
          />

          <p className="text-xs text-gray-400 text-center">
            매일 17:00 업데이트 · 마지막 갱신: {new Date(forecast.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </>
      )}

      {forecast && routeData.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          해당 날짜의 노선별 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
