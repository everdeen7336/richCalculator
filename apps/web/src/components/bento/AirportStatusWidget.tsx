'use client';

import { Terminal } from '@/types';
import { useForecast } from '@/hooks/useForecast';
import { useParking } from '@/hooks/useParking';
import BentoCard from './BentoCard';

function getLevel(value: number, peak: number) {
  if (peak === 0) return { label: '정보없음', color: 'text-gray-400', bg: 'bg-gray-100' };
  const r = value / peak;
  if (r <= 0.3) return { label: '한산', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (r <= 0.55) return { label: '보통', color: 'text-amber-600', bg: 'bg-amber-50' };
  if (r <= 0.8) return { label: '혼잡', color: 'text-orange-600', bg: 'bg-orange-50' };
  return { label: '매우혼잡', color: 'text-red-600', bg: 'bg-red-50' };
}

function TerminalRow({ terminal }: { terminal: Terminal }) {
  const { data: forecastData } = useForecast(terminal);
  const { data: parkingData } = useParking(terminal);

  const hour = new Date().getHours();
  const forecast = forecastData?.data;
  const parking = parkingData?.data;

  const depTotal = forecast?.inOutData?.[hour]?.departure.total ?? 0;
  const depPeak = forecast?.summary.peakDepartureCount ?? 0;
  const arrTotal = forecast?.inOutData?.[hour]?.arrival.total ?? 0;
  const arrPeak = forecast?.summary.peakArrivalCount ?? 0;

  const dep = getLevel(depTotal, depPeak);
  const arr = getLevel(arrTotal, arrPeak);
  const spots = parking?.shortTerm.totalAvailable ?? null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold text-gray-500 w-6">{terminal}</span>
      <div className="flex gap-1.5 flex-1">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${dep.color} ${dep.bg}`}>
          출국 {dep.label}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${arr.color} ${arr.bg}`}>
          입국 {arr.label}
        </span>
      </div>
      <span className="text-[10px] text-gray-400">
        {spots !== null ? `P ${spots}대` : '—'}
      </span>
    </div>
  );
}

export default function AirportStatusWidget() {
  return (
    <BentoCard>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          실시간 공항 현황
        </p>
      </div>
      <div className="space-y-3">
        <TerminalRow terminal={Terminal.T1} />
        <TerminalRow terminal={Terminal.T2} />
      </div>
    </BentoCard>
  );
}
