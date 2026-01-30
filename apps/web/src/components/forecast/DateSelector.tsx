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

function isToday(dateStr: string): boolean {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return dateStr === `${y}${m}${d}`;
}

export function DateSelector({ dates, selected, onSelect }: DateSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {dates.map((dateStr) => {
        const { day, weekday } = formatDateLabel(dateStr);
        const isSelected = selected === dateStr;
        const today = isToday(dateStr);

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
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }
            `}
          >
            <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
              {today ? '오늘' : weekday}
            </span>
            <span className="text-sm font-bold">{day}</span>
          </button>
        );
      })}
    </div>
  );
}
