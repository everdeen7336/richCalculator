'use client';

import { useState } from 'react';
import { Terminal, TERMINAL_CONFIG, HourlyInOutData } from '@/types';
import { useForecast } from '@/hooks/useForecast';
import { DateSelector } from '@/components/forecast/DateSelector';
import { HourlyBarChart } from '@/components/forecast/HourlyBar';
import { CongestionHeatmap } from '@/components/forecast/CongestionHeatmap';
import { PeakSummary } from '@/components/forecast/PeakSummary';
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

export default function InOutCongestionPage() {
  const dates = getDateRange();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal>(Terminal.T1);
  const { data, isLoading, isError, error, refetch } = useForecast(selectedTerminal, selectedDate);
  const currentHour = new Date().getHours();

  const forecast = data?.data;

  const departureHeatmapRows = forecast
    ? [
        { label: '1번 출국장', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.gate1 })) },
        { label: '2번 출국장', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.gate2 })) },
        { label: '3번 출국장', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.gate3 })) },
        { label: '4번 출국장', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.gate4 })) },
        { label: '5·6번', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.gate56 })) },
      ]
    : [];

  const arrivalHeatmapRows = forecast
    ? [
        { label: 'A·B', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.ab })) },
        { label: 'C', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.c })) },
        { label: 'D', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.d })) },
        { label: 'E·F', data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.ef })) },
      ]
    : [];

  const departureTotalByHour = forecast
    ? forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.total }))
    : [];
  const arrivalTotalByHour = forecast
    ? forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.total }))
    : [];

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

      {forecast && (
        <>
          {/* Peak Summary */}
          <PeakSummary summary={forecast.summary} />

          {/* Departure Bar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">출국 승객 추이</h3>
            <p className="text-xs text-gray-400 mb-3">시간대별 총 출국 예상 승객 수</p>
            <HourlyBarChart data={departureTotalByHour} currentHour={currentHour} />
          </div>

          {/* Departure Heatmap */}
          <CongestionHeatmap
            title="출국장별 상세"
            rows={departureHeatmapRows}
            currentHour={currentHour}
          />

          {/* Arrival Bar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">입국 승객 추이</h3>
            <p className="text-xs text-gray-400 mb-3">시간대별 총 입국 예상 승객 수</p>
            <HourlyBarChart data={arrivalTotalByHour} currentHour={currentHour} />
          </div>

          {/* Arrival Heatmap */}
          <CongestionHeatmap
            title="입국장별 상세"
            rows={arrivalHeatmapRows}
            currentHour={currentHour}
          />

          <p className="text-xs text-gray-400 text-center">
            매일 17:00 업데이트 · 마지막 갱신: {new Date(forecast.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </>
      )}
    </div>
  );
}
