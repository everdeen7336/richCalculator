'use client';

interface DateSelectorProps {
  dates: string[];
  selected: string;
  onSelect: (date: string) => void;
}

function formatDateLabel(dateStr: string): { day: string; weekday: string } {
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const date = new Date(y, m, d);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return {
    day: `${m + 1}/${d}`,
    weekday: weekdays[date.getDay()],
  };
}

function getDayDiff(dateStr: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(4, 6), 10) - 1;
  const d = parseInt(dateStr.slice(6, 8), 10);
  const target = new Date(y, m, d);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getRelativeLabel(diff: number, weekday: string): string {
  if (diff === 0) return '오늘';
  if (diff === -1) return '어제';
  if (diff === 1) return '내일';
  if (diff === 2) return '모레';
  return weekday;
}

export function DateSelector({ dates, selected, onSelect }: DateSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
      {dates.map((dateStr) => {
        const { day, weekday } = formatDateLabel(dateStr);
        const diff = getDayDiff(dateStr);
        const label = getRelativeLabel(diff, weekday);
        const isSelected = selected === dateStr;
        const isToday = diff === 0;
        const isFuture = diff > 0;

        return (
          <button
            key={dateStr}
            onClick={() => onSelect(dateStr)}
            className={`
              flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200
              min-w-[56px] border-2
              ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : isToday
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }
            `}
          >
            <span className={`text-xs font-medium ${
              isSelected ? 'text-blue-100' : isToday ? 'text-blue-500' : isFuture ? 'text-green-500' : 'text-gray-400'
            }`}>
              {label}
            </span>
            <span className="text-sm font-bold">{day}</span>
          </button>
        );
      })}
    </div>
  );
}
