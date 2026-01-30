'use client';

import { useState, useMemo } from 'react';
import { Terminal, TERMINAL_CONFIG } from '@/types';
import { useForecast } from '@/hooks/useForecast';
import { DateSelector } from '@/components/forecast/DateSelector';
import { HourlyBarChart } from '@/components/forecast/HourlyBar';
import { CongestionHeatmap } from '@/components/forecast/CongestionHeatmap';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorMessage } from '@/components/common/ErrorMessage';

/** 과거 4일 + 오늘 + 미래 2일 = 7일 (공항 사이트와 동일) */
function getDateRange(): string[] {
  const dates: string[] = [];
  for (let i = -4; i <= 2; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}${m}${day}`);
  }
  return dates;
}

function isToday(dateStr: string): boolean {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return dateStr === `${y}${m}${d}`;
}

function getCrowdLevel(value: number, peak: number) {
  if (peak === 0) return { label: '정보없음', emoji: '⏳', color: 'text-gray-400', bgColor: 'bg-gray-50', advice: '데이터가 아직 없습니다' };
  const ratio = value / peak;
  if (ratio <= 0.3) return { label: '한산', emoji: '😊', color: 'text-green-700', bgColor: 'bg-green-50', advice: '입국심사가 빠르게 진행될 예정입니다' };
  if (ratio <= 0.55) return { label: '보통', emoji: '🙂', color: 'text-yellow-700', bgColor: 'bg-yellow-50', advice: '평소 수준의 대기가 예상됩니다' };
  if (ratio <= 0.8) return { label: '혼잡', emoji: '😰', color: 'text-orange-700', bgColor: 'bg-orange-50', advice: '입국심사 대기가 길 수 있습니다' };
  return { label: '매우혼잡', emoji: '🔥', color: 'text-red-700', bgColor: 'bg-red-50', advice: '자동출입국 심사대를 이용해보세요' };
}

function getArrivalGateLabel(terminal: Terminal, gateKey: string): string {
  if (terminal === Terminal.T2) {
    const t2Map: Record<string, string> = { ab: 'A·B', c: '-', d: '-', ef: 'E·F' };
    return t2Map[gateKey] || gateKey;
  }
  const t1Map: Record<string, string> = { ab: 'A·B', c: 'C', d: 'D', ef: 'E·F' };
  return t1Map[gateKey] || gateKey;
}

export default function ArrivalPage() {
  const dates = getDateRange();
  const [selectedDate, setSelectedDate] = useState(dates[4]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal>(Terminal.T1);
  const { data, isLoading, isError, error, refetch } = useForecast(selectedTerminal, selectedDate);
  const currentHour = new Date().getHours();
  const todaySelected = isToday(selectedDate);

  const forecast = data?.data;

  const computed = useMemo(() => {
    if (!forecast) return null;

    const arrByHour = forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival.total }));
    const peakArr = Math.max(...arrByHour.map((d) => d.value), 1);
    const currentData = forecast.inOutData[currentHour];
    const currentLevel = getCrowdLevel(currentData?.arrival.total ?? 0, peakArr);

    // 입국장별 현재 시간 비교
    const gateKeys = ['ab', 'c', 'd', 'ef'] as const;
    const currentGates = gateKeys
      .map((key) => ({
        key,
        label: getArrivalGateLabel(selectedTerminal, key),
        value: currentData?.arrival[key] ?? 0,
      }))
      .filter((g) => g.label !== '-');

    // 오늘 남은 시간 중 가장 한가한 시간
    const futureHours = todaySelected
      ? forecast.inOutData.filter((d) => d.hour >= currentHour && d.hour >= 5 && d.hour <= 23)
      : forecast.inOutData.filter((d) => d.hour >= 5 && d.hour <= 23);
    const bestHour = futureHours.length > 0
      ? futureHours.reduce((min, d) => (d.arrival.total < min.arrival.total && d.arrival.total > 0 ? d : min), futureHours[0])
      : null;

    // 입국장별 히트맵
    const heatmapRows = gateKeys
      .filter((key) => {
        const hasData = forecast.inOutData.some((d) => d.arrival[key] > 0);
        const label = getArrivalGateLabel(selectedTerminal, key);
        return hasData && label !== '-';
      })
      .map((key) => ({
        label: getArrivalGateLabel(selectedTerminal, key),
        data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.arrival[key] })),
      }));

    return { arrByHour, peakArr, currentData, currentLevel, currentGates, bestHour, heatmapRows };
  }, [forecast, currentHour, todaySelected, selectedTerminal]);

  return (
    <div className="space-y-4">
      {/* 터미널 선택 */}
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

      {forecast && computed && (
        <>
          {/* ① 지금 입국장 혼잡도 요약 */}
          {todaySelected && (
            <div className={`rounded-2xl p-5 ${computed.currentLevel.bgColor} shadow-sm`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{computed.currentLevel.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${computed.currentLevel.color}`}>
                      지금 입국장 — {computed.currentLevel.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{computed.currentLevel.advice}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    현재 {currentHour}시 예상 입국 승객: {(computed.currentData?.arrival.total ?? 0).toLocaleString()}명
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ② 추천 시간대 */}
          {computed.bestHour && computed.bestHour.arrival.total > 0 && (
            <div className="bg-white rounded-2xl shadow-md p-4 border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xl">
                  💡
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {todaySelected ? '오늘 추천 시간' : '추천 시간'}:{' '}
                    <span className="text-green-600">{computed.bestHour.hour}시</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {todaySelected ? '남은 시간 중 ' : ''}가장 한가한 시간대 ·{' '}
                    예상 {computed.bestHour.arrival.total.toLocaleString()}명
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ③ 피크 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-400">
              <p className="text-xs text-gray-400 mb-1">⚠️ 가장 붐비는 시간</p>
              <p className="text-2xl font-bold text-gray-800">{forecast.summary.peakArrivalHour}시</p>
              <p className="text-xs text-gray-500 mt-1">
                {forecast.summary.peakArrivalCount.toLocaleString()}명 예상
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-400">
              <p className="text-xs text-gray-400 mb-1">📊 하루 총 입국</p>
              <p className="text-2xl font-bold text-gray-800">
                {(forecast.summary.totalArrival / 10000).toFixed(1)}
                <span className="text-base font-normal text-gray-400">만명</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {forecast.summary.totalArrival.toLocaleString()}명
              </p>
            </div>
          </div>

          {/* ④ 시간대별 입국 승객 바 차트 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">시간대별 입국 승객</h3>
            <p className="text-xs text-gray-400 mb-3">
              막대가 붉을수록 혼잡 · {todaySelected && <span className="text-blue-500 font-medium">파란 숫자 = 현재 시간</span>}
            </p>
            <HourlyBarChart data={computed.arrByHour} currentHour={todaySelected ? currentHour : -1} />
          </div>

          {/* ⑤ 입국장별 비교 (현재 시간) */}
          {todaySelected && computed.currentGates.filter((g) => g.value > 0).length > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">입국장별 지금 비교</h3>
              <p className="text-xs text-gray-400 mb-3">숫자가 적은 입국장이 상대적으로 여유롭습니다</p>
              <div className="space-y-2">
                {computed.currentGates
                  .filter((g) => g.value > 0)
                  .sort((a, b) => a.value - b.value)
                  .map((gate, idx) => {
                    const maxGate = Math.max(...computed.currentGates.map((g) => g.value), 1);
                    const ratio = gate.value / maxGate;
                    const isLowest = idx === 0;
                    return (
                      <div key={gate.key} className="flex items-center gap-3">
                        <span className={`text-sm font-medium w-14 ${isLowest ? 'text-green-600' : 'text-gray-600'}`}>
                          {gate.label}
                        </span>
                        <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all flex items-center justify-end pr-2 ${
                              isLowest ? 'bg-green-400' : ratio > 0.8 ? 'bg-red-400' : 'bg-orange-300'
                            }`}
                            style={{ width: `${Math.max(ratio * 100, 8)}%` }}
                          >
                            <span className="text-xs font-bold text-white drop-shadow">
                              {gate.value.toLocaleString()}명
                            </span>
                          </div>
                        </div>
                        {isLowest && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            추천
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ⑥ 입국장별 시간대 히트맵 */}
          <CongestionHeatmap
            title="입국장별 시간대 상세"
            rows={computed.heatmapRows}
            currentHour={todaySelected ? currentHour : -1}
          />

          <p className="text-xs text-gray-400 text-center pb-4">
            인천국제공항 제공 · 마지막 갱신: {new Date(forecast.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </>
      )}
    </div>
  );
}
