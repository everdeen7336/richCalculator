'use client';

function getBarColor(ratio: number): string {
  if (ratio <= 0.25) return '#22C55E';
  if (ratio <= 0.5) return '#EAB308';
  if (ratio <= 0.75) return '#F97316';
  return '#EF4444';
}

export function HourlyBarChart({
  data,
  currentHour,
}: {
  data: { hour: number; value: number }[];
  currentHour: number;
}) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  // 주요 시간만 라벨 표시 (0, 3, 6, 9, 12, 15, 18, 21 + 현재)
  const labelHours = new Set([0, 3, 6, 9, 12, 15, 18, 21, currentHour]);

  return (
    <div className="flex flex-col gap-1">
      {/* 바 차트 */}
      <div className="flex items-end gap-[2px] w-full px-1" style={{ height: '120px' }}>
        {data.map((d) => {
          const ratio = maxValue > 0 ? d.value / maxValue : 0;
          const heightPercent = Math.max(ratio * 100, 2);
          const color = getBarColor(ratio);
          const isCurrent = d.hour === currentHour;

          return (
            <div
              key={d.hour}
              className="flex-1 min-w-0 h-full flex items-end justify-center group relative"
            >
              {/* 호버/터치 툴팁 */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block group-focus:block z-10 pointer-events-none">
                <div className="bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                  {d.hour}시 {d.value.toLocaleString()}명
                </div>
              </div>
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: color,
                  opacity: d.value === 0 ? 0.15 : 1,
                  maxWidth: '20px',
                  margin: '0 auto',
                }}
              />
            </div>
          );
        })}
      </div>
      {/* 시간 라벨 */}
      <div className="flex gap-[2px] w-full px-1">
        {data.map((d) => {
          const isCurrent = d.hour === currentHour;
          const showLabel = labelHours.has(d.hour);
          return (
            <div key={d.hour} className="flex-1 min-w-0 text-center">
              <span
                className={`text-[9px] tabular-nums leading-none ${
                  isCurrent
                    ? 'font-bold text-blue-600'
                    : showLabel
                      ? 'text-gray-400'
                      : 'text-transparent'
                }`}
              >
                {d.hour}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
