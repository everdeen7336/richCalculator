'use client';

import { useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';
import type { Accommodation, AccommodationType } from '@/types/journey';
import { ACCOMMODATION_TYPE_LABEL } from '@/types/journey';

const TYPE_ICONS: Record<AccommodationType, string> = {
  hotel: '🏨', airbnb: '🏠', hostel: '🛏️', guesthouse: '🏡', other: '📍',
};

export default function AccommodationCard() {
  const { accommodations, addAccommodation, removeAccommodation, departureDate, destination } = useJourneyStore();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccommodationType>('hotel');
  const [checkIn, setCheckIn] = useState(departureDate || '');
  const [checkOut, setCheckOut] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !checkIn || !checkOut) return;
    const acc: Accommodation = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      type,
      checkIn,
      checkOut,
      confirmationCode: confirmationCode.trim() || undefined,
      booked: true,
    };
    addAccommodation(acc);
    setName(''); setConfirmationCode(''); setAdding(false);
  };

  const nights = (ci: string, co: string) => {
    const diff = (new Date(co).getTime() - new Date(ci).getTime()) / 86400000;
    return diff > 0 ? diff : 0;
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 외부 검색 링크
  const dest = encodeURIComponent(destination || '');
  const bookingUrl = `https://www.booking.com/searchresults.html?ss=${dest}&checkin=${departureDate}`;
  const airbnbUrl = `https://www.airbnb.co.kr/s/${dest}/homes?checkin=${departureDate}`;

  return (
    <BentoCard variant="default" className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🏨</span>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">숙소</h3>
          {accommodations.length > 0 && (
            <span className="text-[11px] text-[var(--text-muted)]">{accommodations.length}곳</span>
          )}
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-[11px] text-[var(--accent)] hover:underline"
          >
            + 추가
          </button>
        )}
      </div>

      {/* 등록된 숙소 목록 */}
      {accommodations.map((acc) => (
        <div key={acc.id} className="mb-2 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-light)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{TYPE_ICONS[acc.type]}</span>
                <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">{acc.name}</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                {formatDate(acc.checkIn)} → {formatDate(acc.checkOut)} · {nights(acc.checkIn, acc.checkOut)}박
              </p>
              {acc.confirmationCode && (
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">
                  확인번호: {acc.confirmationCode}
                </p>
              )}
            </div>
            <button
              onClick={() => removeAccommodation(acc.id)}
              className="text-[var(--text-muted)] hover:text-[#C4564A] text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {/* 추가 폼 */}
      {adding && (
        <div className="space-y-2 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="숙소 이름"
            className="w-full text-[13px] px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AccommodationType)}
              className="text-[12px] px-2 py-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--text-secondary)] focus:outline-none"
            >
              {Object.entries(ACCOMMODATION_TYPE_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <input
              value={confirmationCode}
              onChange={(e) => setConfirmationCode(e.target.value)}
              placeholder="확인번호 (선택)"
              className="flex-1 text-[12px] px-2 py-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">체크인</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--text-primary)] focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">체크아웃</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full text-[12px] px-2 py-1.5 rounded-md border border-[var(--border)] bg-white text-[var(--text-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={!name.trim() || !checkIn || !checkOut}
              className="flex-1 text-[12px] py-1.5 rounded-md bg-[var(--accent)] text-white disabled:opacity-40"
            >
              등록
            </button>
            <button
              onClick={() => setAdding(false)}
              className="text-[12px] py-1.5 px-3 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 빈 상태 — 외부 검색 유도 */}
      {accommodations.length === 0 && !adding && (
        <div className="text-center py-3">
          <p className="text-[12px] text-[var(--text-muted)] mb-3">숙소를 등록해보세요</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {destination && (
              <>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  Booking.com
                </a>
                <a
                  href={airbnbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  에어비앤비
                </a>
              </>
            )}
            <button
              onClick={() => setAdding(true)}
              className="text-[11px] px-3 py-1.5 rounded-full border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              직접 등록
            </button>
          </div>
        </div>
      )}
    </BentoCard>
  );
}
