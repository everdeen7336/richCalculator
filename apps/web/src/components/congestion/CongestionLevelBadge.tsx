import { CongestionLevel, CONGESTION_LEVEL_META } from '@/types';

interface CongestionLevelBadgeProps {
  level: CongestionLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function CongestionLevelBadge({
  level,
  size = 'md',
  showLabel = true,
}: CongestionLevelBadgeProps) {
  const meta = CONGESTION_LEVEL_META[level];

  return (
    <div className="flex items-center gap-2">
      <span
        className={`${sizeClasses[size]} rounded-full animate-pulse`}
        style={{ backgroundColor: meta.color }}
      />
      {showLabel && (
        <span
          className={`${textSizeClasses[size]} font-semibold`}
          style={{ color: meta.color }}
        >
          {meta.labelKo}
        </span>
      )}
    </div>
  );
}
