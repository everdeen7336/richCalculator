'use client';

import { useEffect, useState } from 'react';
import BentoCard from './BentoCard';

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateStr = now.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const timeStr = now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <BentoCard variant="dark">
      <p className="bento-label !text-[#8A8578] mb-2">현재 시간</p>
      <p className="text-4xl bento-value !text-white">{timeStr}</p>
      <p className="text-sm text-[#8A8578] mt-1">{dateStr}</p>
    </BentoCard>
  );
}
