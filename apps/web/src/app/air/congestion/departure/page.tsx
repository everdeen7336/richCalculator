'use client';

import { useState, useMemo } from 'react';
import { Terminal, TERMINAL_CONFIG, HourlyInOutData } from '@/types';
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

const ROUTE_META: Record<string, { label: string; emoji: string; color: string }> = {
  japan: { label: '일본', emoji: '🇯🇵', color: '#EF4444' },
  china: { label: '중국', emoji: '🇨🇳', color: '#F59E0B' },
  southeastAsia: { label: '동남아', emoji: '🌴', color: '#10B981' },
  northAmerica: { label: '미주', emoji: '🇺🇸', color: '#3B82F6' },
  europe: { label: '유럽', emoji: '🇪🇺', color: '#8B5CF6' },
  oceania: { label: '대양주', emoji: '🇦🇺', color: '#06B6D4' },
  other: { label: '기타', emoji: '🌍', color: '#6B7280' },
};
const ROUTE_KEYS = Object.keys(ROUTE_META) as (keyof typeof ROUTE_META)[];

/** 혼잡 레벨 판단 (시간대 승객수 / 피크 대비 비율) */
function getCrowdLevel(value: number, peak: number): { label: string; emoji: string; color: string; bgColor: string; advice: string } {
  if (peak === 0) return { label: '정보없음', emoji: '⏳', color: 'text-gray-400', bgColor: 'bg-gray-50', advice: '데이터가 아직 없습니다' };
  const ratio = value / peak;
  if (ratio <= 0.3) return { label: '한산', emoji: '😊', color: 'text-green-700', bgColor: 'bg-green-50', advice: '여유롭게 이용 가능합니다' };
  if (ratio <= 0.55) return { label: '보통', emoji: '🙂', color: 'text-yellow-700', bgColor: 'bg-yellow-50', advice: '평소 수준입니다' };
  if (ratio <= 0.8) return { label: '혼잡', emoji: '😰', color: 'text-orange-700', bgColor: 'bg-orange-50', advice: '여유 있게 출발하세요' };
  return { label: '매우혼잡', emoji: '🔥', color: 'text-red-700', bgColor: 'bg-red-50', advice: '최소 3시간 전 도착 권장' };
}

/** T2 출국장 이름 매핑 */
function getDepartureGateLabel(terminal: Terminal, gateKey: string): string {
  if (terminal === Terminal.T2) {
    const t2Map: Record<string, string> = {
      gate1: '출국장 1', gate2: '출국장 2', gate3: '출국장', gate4: '-', gate56: '-',
    };
    return t2Map[gateKey] || gateKey;
  }
  const t1Map: Record<string, string> = {
    gate1: '1번', gate2: '2번', gate3: '3번', gate4: '4번', gate56: '5·6번',
  };
  return t1Map[gateKey] || gateKey;
}

export default function DeparturePage() {
  const dates = getDateRange();
  const [selectedDate, setSelectedDate] = useState(dates[4]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal>(Terminal.T1);
  const { data, isLoading, isError, error, refetch } = useForecast(selectedTerminal, selectedDate);
  const currentHour = new Date().getHours();
  const todaySelected = isToday(selectedDate);

  const forecast = data?.data;

  // 출국 데이터 계산
  const computed = useMemo(() => {
    if (!forecast) return null;
    const depByHour = forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure.total }));
    const peakDep = Math.max(...depByHour.map((d) => d.value), 1);
    const currentData = forecast.inOutData[currentHour];
    const currentLevel = getCrowdLevel(currentData?.departure.total ?? 0, peakDep);

    // 오늘 남은 시간 중 가장 한가한 시간 (5시~23시, 현재 시간 이후)
    const futureHours = todaySelected
      ? forecast.inOutData.filter((d) => d.hour >= currentHour && d.hour >= 5 && d.hour <= 22)
      : forecast.inOutData.filter((d) => d.hour >= 5 && d.hour <= 22);
    const bestHour = futureHours.length > 0
      ? futureHours.reduce((min, d) => (d.departure.total < min.departure.total && d.departure.total > 0 ? d : min), futureHours[0])
      : null;

    // 출국장별 현재 시간 비교 (어디가 덜 붐비는지)
    const gateKeys = ['gate1', 'gate2', 'gate3', 'gate4', 'gate56'] as const;
    const currentGates = gateKeys
      .map((key) => ({
        key,
        label: getDepartureGateLabel(selectedTerminal, key),
        value: currentData?.departure[key] ?? 0,
      }))
      .filter((g) => g.value > 0 || g.label !== '-');

    // 출국장별 히트맵
    const heatmapRows = gateKeys
      .filter((key) => {
        const hasData = forecast.inOutData.some((d) => d.departure[key] > 0);
        return hasData;
      })
      .map((key) => ({
        label: getDepartureGateLabel(selectedTerminal, key),
        data: forecast.inOutData.map((d) => ({ hour: d.hour, value: d.departure[key] })),
      }));

    // 노선별 합산
    const routeData = forecast.routeData;
    const routeTotals = ROUTE_KEYS.map((key) => ({
      key,
      ...ROUTE_META[key],
      total: routeData.reduce((sum, d) => sum + ((d[key as keyof typeof d] as number) || 0), 0),
    })).filter((r) => r.total > 0).sort((a, b) => b.total - a.total);

    return { depByHour, peakDep, currentData, currentLevel, bestHour, currentGates, heatmapRows, routeTotals };
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
          {/* ① 지금 혼잡도 요약 */}
          {todaySelected && (
            <div className={`rounded-2xl p-5 ${computed.currentLevel.bgColor} shadow-sm`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{computed.currentLevel.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${computed.currentLevel.color}`}>
                      지금 출국장 — {computed.currentLevel.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{computed.currentLevel.advice}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    현재 {currentHour}시 예상 출국 승객: {(computed.currentData?.departure.total ?? 0).toLocaleString()}명
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ② 추천 시간대 */}
          {computed.bestHour && computed.bestHour.departure.total > 0 && (
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
                    예상 {computed.bestHour.departure.total.toLocaleString()}명
                    {computed.currentData && todaySelected && (
                      <span className="text-green-600 ml-1">
                        (지금보다 {Math.round((1 - computed.bestHour.departure.total / Math.max(computed.currentData.departure.total, 1)) * 100)}% 적음)
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ③ 피크 경고 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-400">
              <p className="text-xs text-gray-400 mb-1">⚠️ 가장 붐비는 시간</p>
              <p className="text-2xl font-bold text-gray-800">{forecast.summary.peakDepartureHour}시</p>
              <p className="text-xs text-gray-500 mt-1">
                {forecast.summary.peakDepartureCount.toLocaleString()}명 예상
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-400">
              <p className="text-xs text-gray-400 mb-1">📊 하루 총 출국</p>
              <p className="text-2xl font-bold text-gray-800">
                {(forecast.summary.totalDeparture / 10000).toFixed(1)}
                <span className="text-base font-normal text-gray-400">만명</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {forecast.summary.totalDeparture.toLocaleString()}명
              </p>
            </div>
          </div>

          {/* ④ 시간대별 출국 승객 바 차트 */}
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <h3 className="text-base font-bold text-gray-800 mb-1">시간대별 출국 승객</h3>
            <p className="text-xs text-gray-400 mb-3">
              막대가 붉을수록 혼잡 · {todaySelected && <span className="text-blue-500 font-medium">파란 숫자 = 현재 시간</span>}
            </p>
            <HourlyBarChart data={computed.depByHour} currentHour={todaySelected ? currentHour : -1} />
          </div>

          {/* ⑤ 출국장별 비교 (현재 시간) */}
          {todaySelected && computed.currentGates.filter((g) => g.value > 0).length > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">출국장별 지금 비교</h3>
              <p className="text-xs text-gray-400 mb-3">숫자가 적은 곳이 상대적으로 여유롭습니다</p>
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

          {/* ⑥ 출국장별 시간대 히트맵 */}
          <CongestionHeatmap
            title="출국장별 시간대 상세"
            rows={computed.heatmapRows}
            currentHour={todaySelected ? currentHour : -1}
          />

          {/* ⑦ 노선별 승객 현황 */}
          {computed.routeTotals.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h3 className="text-base font-bold text-gray-800 mb-1">목적지별 승객</h3>
              <p className="text-xs text-gray-400 mb-3">내 노선의 전체 출국 예상 인원</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {computed.routeTotals.map((route) => (
                  <div
                    key={route.key}
                    className="rounded-xl p-3 border"
                    style={{ borderColor: `${route.color}40`, backgroundColor: `${route.color}08` }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{route.emoji}</span>
                      <span className="text-xs font-medium text-gray-700">{route.label}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">
                      {route.total.toLocaleString()}
                      <span className="text-[10px] font-normal text-gray-400 ml-0.5">명</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center pb-4">
            인천국제공항 제공 · 마지막 갱신: {new Date(forecast.lastUpdated).toLocaleString('ko-KR')}
          </p>
        </>
      )}
    </div>
  );
}
