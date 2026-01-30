'use client';

import { CongestionForecast } from '@/types';

interface PeakSummaryProps {
  summary: CongestionForecast['summary'];
}

export function PeakSummary({ summary }: PeakSummaryProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
        <p className="text-xs text-blue-600 font-medium mb-1">출국 피크</p>
        <p className="text-2xl font-bold text-blue-800">
          {summary.peakDepartureHour}시
        </p>
        <p className="text-sm text-blue-600 mt-1">
          {summary.peakDepartureCount.toLocaleString()}명
        </p>
        <p className="text-xs text-blue-400 mt-2">
          총 {summary.totalDeparture.toLocaleString()}명
        </p>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
        <p className="text-xs text-green-600 font-medium mb-1">입국 피크</p>
        <p className="text-2xl font-bold text-green-800">
          {summary.peakArrivalHour}시
        </p>
        <p className="text-sm text-green-600 mt-1">
          {summary.peakArrivalCount.toLocaleString()}명
        </p>
        <p className="text-xs text-green-400 mt-2">
          총 {summary.totalArrival.toLocaleString()}명
        </p>
      </div>
    </div>
  );
}
