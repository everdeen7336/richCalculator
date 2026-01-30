'use client';

import { ParkingInfo, TERMINAL_CONFIG } from '@/types';
import { ParkingSection } from './ParkingSection';
import { RefreshButton } from '../common/RefreshButton';

interface ParkingCardProps {
  parking: ParkingInfo;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ParkingCard({ parking, isRefreshing, onRefresh }: ParkingCardProps) {
  const terminalConfig = TERMINAL_CONFIG[parking.terminal];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">주차장 현황</h2>
          <p className="text-sm text-gray-500">{terminalConfig.nameKo}</p>
        </div>
        <RefreshButton onClick={onRefresh} isLoading={isRefreshing} />
      </div>

      {/* 혼잡 시간대 경고 */}
      {parking.peakHoursWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
          <p className="text-yellow-700 text-sm font-medium">
            현재 혼잡 시간대입니다 (05:00-08:00, 16:00-19:00)
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 단기주차장 */}
        <ParkingSection
          title="단기주차장"
          color="blue"
          floors={parking.shortTerm.floors}
          totalAvailable={parking.shortTerm.totalAvailable}
          hasFull={parking.shortTerm.hasFull}
        />

        {/* 장기주차장 */}
        <ParkingSection
          title="장기주차장"
          color="green"
          floors={parking.longTerm.floors}
          towers={parking.longTerm.towers}
          totalAvailable={parking.longTerm.totalAvailable}
          hasFull={parking.longTerm.hasFull}
          unavailable={parking.longTerm.unavailable}
        />
      </div>
    </div>
  );
}
