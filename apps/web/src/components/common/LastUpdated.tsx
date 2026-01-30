'use client';

import { useEffect, useState } from 'react';

interface LastUpdatedProps {
  timestamp: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function LastUpdated({ timestamp, onRefresh, isRefreshing }: LastUpdatedProps) {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date();
      const updated = new Date(timestamp);
      const diffMs = now.getTime() - updated.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);

      if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}초 전`);
      } else if (diffSeconds < 3600) {
        setTimeAgo(`${Math.floor(diffSeconds / 60)}분 전`);
      } else {
        setTimeAgo(
          updated.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        );
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return (
    <div className="flex items-center justify-between text-sm text-gray-500 px-2">
      <span>마지막 업데이트: {timeAgo}</span>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="text-blue-500 hover:text-blue-600 disabled:text-gray-400 font-medium"
      >
        {isRefreshing ? '새로고침 중...' : '지금 새로고침'}
      </button>
    </div>
  );
}
