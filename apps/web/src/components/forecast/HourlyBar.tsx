'use client';

interface HourlyBarProps {
  hour: number;
  value: number;
  maxValue: number;
  isCurrentHour?: boolean;
}

function getBarColor(ratio: number): string {
  if (ratio <= 0.25) return '#22C55E';
  if (ratio <= 0.5) return '#EAB308';
  if (ratio <= 0.75) return '#F97316';
  return '#EF4444';
}

function getBarBg(ratio: number): string {
  if (ratio <= 0.25) return 'rgba(34,197,94,0.1)';
  if (ratio <= 0.5) return 'rgba(234,179,8,0.1)';
  if (ratio <= 0.75) return 'rgba(249,115,22,0.1)';
  return 'rgba(239,68,68,0.1)';
}

export function HourlyBar({ hour, value, maxValue, isCurrentHour }: HourlyBarProps) {
  const ratio = maxValue > 0 ? value / maxValue : 0;
  const heightPercent = Math.max(ratio * 100, 2);
  const color = getBarColor(ratio);

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className="text-[10px] text-gray-500 tabular-nums">
        {value > 0 ? value.toLocaleString() : ''}
      </span>
      <div className="w-full h-24 flex items-end justify-center">
        <div
          className="w-full max-w-[20px] rounded-t-sm transition-all duration-300"
          style={{
            height: `${heightPercent}%`,
            backgroundColor: color,
            opacity: value === 0 ? 0.2 : 1,
          }}
        />
      </div>
      <span
        className={`text-[10px] tabular-nums ${
          isCurrentHour ? 'font-bold text-blue-600' : 'text-gray-400'
        }`}
      >
        {hour}
      </span>
    </div>
  );
}

export function HourlyBarChart({
  data,
  currentHour,
}: {
  data: { hour: number; value: number }[];
  currentHour: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-[2px] w-full overflow-x-auto px-1">
      {data.map((d) => (
        <HourlyBar
          key={d.hour}
          hour={d.hour}
          value={d.value}
          maxValue={maxValue}
          isCurrentHour={d.hour === currentHour}
        />
      ))}
    </div>
  );
}
