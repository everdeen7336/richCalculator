'use client';

interface HeatmapCell {
  hour: number;
  value: number;
}

interface CongestionHeatmapProps {
  title: string;
  rows: { label: string; data: HeatmapCell[] }[];
  currentHour: number;
}

function getCellColor(value: number, maxValue: number): string {
  if (value === 0) return 'rgba(156,163,175,0.1)';
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio <= 0.25) return 'rgba(34,197,94,0.3)';
  if (ratio <= 0.5) return 'rgba(234,179,8,0.4)';
  if (ratio <= 0.75) return 'rgba(249,115,22,0.5)';
  return 'rgba(239,68,68,0.6)';
}

function getCellTextColor(value: number, maxValue: number): string {
  if (value === 0) return '#9CA3AF';
  const ratio = maxValue > 0 ? value / maxValue : 0;
  if (ratio <= 0.25) return '#15803D';
  if (ratio <= 0.5) return '#A16207';
  if (ratio <= 0.75) return '#C2410C';
  return '#DC2626';
}

export function CongestionHeatmap({ title, rows, currentHour }: CongestionHeatmapProps) {
  const allValues = rows.flatMap((r) => r.data.map((d) => d.value));
  const maxValue = Math.max(...allValues, 1);

  // Show hours 5-23 for better readability (most relevant hours)
  const displayHours = Array.from({ length: 19 }, (_, i) => i + 5);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 overflow-hidden">
      <h3 className="text-base font-bold text-gray-800 mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white z-10 text-left text-gray-500 font-normal px-1 py-1 w-16">
                시간
              </th>
              {displayHours.map((h) => (
                <th
                  key={h}
                  className={`text-center px-0.5 py-1 font-normal ${
                    h === currentHour ? 'text-blue-600 font-bold' : 'text-gray-400'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="sticky left-0 bg-white z-10 text-gray-700 font-medium px-1 py-1 whitespace-nowrap">
                  {row.label}
                </td>
                {displayHours.map((h) => {
                  const cell = row.data.find((d) => d.hour === h);
                  const value = cell?.value ?? 0;
                  return (
                    <td
                      key={h}
                      className={`text-center px-0.5 py-1.5 rounded-sm ${
                        h === currentHour ? 'ring-1 ring-blue-400' : ''
                      }`}
                      style={{
                        backgroundColor: getCellColor(value, maxValue),
                        color: getCellTextColor(value, maxValue),
                      }}
                      title={`${h}시: ${value.toLocaleString()}명`}
                    >
                      {value > 0 ? (value >= 1000 ? `${Math.round(value / 100) / 10}k` : value) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span>혼잡도:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(34,197,94,0.3)' }} />
          <span>원활</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(234,179,8,0.4)' }} />
          <span>보통</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(249,115,22,0.5)' }} />
          <span>혼잡</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239,68,68,0.6)' }} />
          <span>매우혼잡</span>
        </div>
      </div>
    </div>
  );
}
