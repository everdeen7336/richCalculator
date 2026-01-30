'use client';

import {
  TerminalCongestion,
  CONGESTION_LEVEL_META,
  TERMINAL_CONFIG,
} from '@/types';
import { CongestionLevelBadge } from './CongestionLevelBadge';
import { RefreshButton } from '../common/RefreshButton';

interface CongestionCardProps {
  congestion: TerminalCongestion;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function CongestionCard({ congestion, isRefreshing, onRefresh }: CongestionCardProps) {
  const overallMeta = CONGESTION_LEVEL_META[congestion.overallLevel];
  const terminalConfig = TERMINAL_CONFIG[congestion.terminal];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">공항 혼잡도</h2>
          <p className="text-sm text-gray-500">{terminalConfig.nameKo}</p>
        </div>
        <div className="flex items-center gap-3">
          <CongestionLevelBadge level={congestion.overallLevel} size="lg" />
          <RefreshButton onClick={onRefresh} isLoading={isRefreshing} />
        </div>
      </div>

      {/* 전체 혼잡도 */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ backgroundColor: `${overallMeta.color}15` }}
      >
        <div className="flex items-center justify-between">
          <span className="text-gray-700 font-medium">전체 혼잡도</span>
          <span
            className="text-2xl font-bold"
            style={{ color: overallMeta.color }}
          >
            {overallMeta.labelKo}
          </span>
        </div>
      </div>

      {/* 게이트별 대기시간 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          출국장별 대기시간
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {congestion.gates.map((gate) => {
            const gateMeta = CONGESTION_LEVEL_META[gate.congestionLevel];
            return (
              <div
                key={gate.gateId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium text-gray-700">{gate.gateName}</span>
                <div className="flex items-center gap-2">
                  <span
                    className="font-bold"
                    style={{ color: gateMeta.color }}
                  >
                    {gate.waitTimeMinutes !== null ? `${gate.waitTimeMinutes}분` : '-'}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: gateMeta.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
