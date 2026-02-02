'use client';

import { useState } from 'react';
import { useJourneyStore } from '@/stores/journey.store';
import { GA } from '@/lib/analytics';

export default function ShareButton() {
  const { departureFlight, returnFlight, destination, items } = useJourneyStore();
  const [copied, setCopied] = useState(false);

  const hasFlight = !!(departureFlight || returnFlight);
  if (!hasFlight && items.length === 0) return null;

  const handleShare = async () => {
    const dest = destination || departureFlight?.arrival?.city || '여행';
    const placeCount = items.length;
    const text = placeCount > 0
      ? `${dest} 여행 일정 (${placeCount}곳) — 토키보`
      : `${dest} 여행 — 토키보`;

    const shareData = {
      title: `${dest} 여행 — 토키보`,
      text,
      url: window.location.href,
    };

    // Web Share API가 있으면 네이티브 공유
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        GA.shareClicked('native');
        return;
      } catch {
        // 사용자가 취소한 경우 — 무시
      }
    }

    // 없으면 클립보드 복사
    try {
      await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      GA.shareClicked('clipboard');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <button
      onClick={handleShare}
      className="
        text-[11px] px-3 py-1.5 rounded-full
        border border-[var(--border)] text-[var(--text-secondary)]
        hover:border-[var(--accent)] hover:text-[var(--accent)]
        transition-all duration-200
      "
    >
      {copied ? '복사됨 ✓' : '일정 공유'}
    </button>
  );
}
