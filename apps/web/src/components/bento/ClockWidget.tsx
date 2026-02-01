'use client';

import { useEffect, useState } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';

/** 도시 → IANA timezone */
const CITY_TZ: Record<string, string> = {
  '발리': 'Asia/Makassar', '방콕': 'Asia/Bangkok', '싱가포르': 'Asia/Singapore',
  '호치민': 'Asia/Ho_Chi_Minh', '하노이': 'Asia/Bangkok', '다낭': 'Asia/Ho_Chi_Minh',
  '세부': 'Asia/Manila', '보라카이': 'Asia/Manila', '푸켓': 'Asia/Bangkok',
  '치앙마이': 'Asia/Bangkok', '코타키나발루': 'Asia/Kuala_Lumpur', '쿠알라룸푸르': 'Asia/Kuala_Lumpur',
  '도쿄': 'Asia/Tokyo', '오사카': 'Asia/Tokyo', '후쿠오카': 'Asia/Tokyo',
  '삿포로': 'Asia/Tokyo', '교토': 'Asia/Tokyo', '오키나와': 'Asia/Tokyo',
  '상하이': 'Asia/Shanghai', '베이징': 'Asia/Shanghai', '홍콩': 'Asia/Hong_Kong',
  '타이베이': 'Asia/Taipei', '마카오': 'Asia/Macau',
  '파리': 'Europe/Paris', '런던': 'Europe/London', '로마': 'Europe/Rome',
  '바르셀로나': 'Europe/Madrid', '프라하': 'Europe/Prague', '암스테르담': 'Europe/Amsterdam',
  '뮌헨': 'Europe/Berlin', '취리히': 'Europe/Zurich', '이스탄불': 'Europe/Istanbul',
  '뉴욕': 'America/New_York', '로스앤젤레스': 'America/Los_Angeles', 'LA': 'America/Los_Angeles',
  '하와이': 'Pacific/Honolulu', '샌프란시스코': 'America/Los_Angeles',
  '시드니': 'Australia/Sydney', '괌': 'Pacific/Guam', '사이판': 'Pacific/Guam',
  '제주': 'Asia/Seoul', '부산': 'Asia/Seoul', '서울': 'Asia/Seoul',
  '인천': 'Asia/Seoul', '대구': 'Asia/Seoul',
  '서울(김포)': 'Asia/Seoul', '도쿄(나리타)': 'Asia/Tokyo', '도쿄(하네다)': 'Asia/Tokyo',
};

/** 공항 코드 → IANA timezone */
const AIRPORT_TZ: Record<string, string> = {
  'ICN': 'Asia/Seoul', 'GMP': 'Asia/Seoul', 'PUS': 'Asia/Seoul', 'CJU': 'Asia/Seoul', 'TAE': 'Asia/Seoul',
  'NRT': 'Asia/Tokyo', 'HND': 'Asia/Tokyo', 'KIX': 'Asia/Tokyo', 'FUK': 'Asia/Tokyo',
  'BKK': 'Asia/Bangkok', 'HKT': 'Asia/Bangkok',
  'SIN': 'Asia/Singapore', 'KUL': 'Asia/Kuala_Lumpur',
  'HKG': 'Asia/Hong_Kong', 'TPE': 'Asia/Taipei',
  'PVG': 'Asia/Shanghai', 'PEK': 'Asia/Shanghai',
  'DPS': 'Asia/Makassar', 'CGK': 'Asia/Jakarta',
  'SGN': 'Asia/Ho_Chi_Minh', 'HAN': 'Asia/Bangkok', 'DAD': 'Asia/Ho_Chi_Minh',
  'CEB': 'Asia/Manila',
  'CDG': 'Europe/Paris', 'LHR': 'Europe/London', 'FCO': 'Europe/Rome', 'IST': 'Europe/Istanbul',
  'JFK': 'America/New_York', 'LAX': 'America/Los_Angeles', 'SFO': 'America/Los_Angeles',
  'HNL': 'Pacific/Honolulu', 'GUM': 'Pacific/Guam', 'SPN': 'Pacific/Guam',
  'SYD': 'Australia/Sydney',
};

function resolveTz(city?: string, airport?: string): string | null {
  if (city && CITY_TZ[city]) return CITY_TZ[city];
  if (airport && AIRPORT_TZ[airport]) return AIRPORT_TZ[airport];
  if (city) {
    for (const [key, tz] of Object.entries(CITY_TZ)) {
      if (city.includes(key)) return tz;
    }
  }
  return null;
}

function fmtTime(now: Date, tz: string): string {
  return now.toLocaleTimeString('ko-KR', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz,
  });
}

function fmtDate(now: Date, tz: string): string {
  return now.toLocaleDateString('ko-KR', {
    month: 'short', day: 'numeric', weekday: 'short', timeZone: tz,
  });
}

interface ClockInfo {
  label: string;
  tz: string;
  color: 'white' | 'amber' | 'accent';
}

export default function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const { destination, departureFlight, returnFlight } = useJourneyStore();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // 시계 목록 구성 (중복 timezone 제거)
  const clocks: ClockInfo[] = [];
  const usedTzs = new Set<string>();

  // 1) 내 위치 (항상 표시)
  clocks.push({ label: '내 위치', tz: localTz, color: 'white' });
  usedTzs.add(localTz);

  // 2) 출발지 (출국편 or 귀국편 출발지, 로컬과 다르면)
  const depFlight = departureFlight || returnFlight;
  const depTz = resolveTz(
    depFlight?.departure?.city,
    depFlight?.departure?.airport,
  );
  if (depTz && !usedTzs.has(depTz)) {
    clocks.push({
      label: depFlight?.departure?.city || depFlight?.departure?.airport || '출발지',
      tz: depTz,
      color: 'amber',
    });
    usedTzs.add(depTz);
  }

  // 3) 도착지 (출국편 도착지 → 귀국편 도착지 → destination 순)
  const arrCity = departureFlight?.arrival?.city || returnFlight?.arrival?.city || destination;
  const arrAirport = departureFlight?.arrival?.airport || returnFlight?.arrival?.airport;
  const arrTz = resolveTz(arrCity, arrAirport);
  if (arrTz && !usedTzs.has(arrTz)) {
    clocks.push({
      label: arrCity || arrAirport || '도착지',
      tz: arrTz,
      color: 'accent',
    });
    usedTzs.add(arrTz);
  }

  // 4) 귀국편에 다른 도시가 있으면 추가 (출국편+귀국편 동시 등록 시)
  if (departureFlight && returnFlight) {
    const retDepTz = resolveTz(returnFlight.departure?.city, returnFlight.departure?.airport);
    if (retDepTz && !usedTzs.has(retDepTz)) {
      clocks.push({
        label: returnFlight.departure?.city || returnFlight.departure?.airport || '귀국 출발지',
        tz: retDepTz,
        color: 'accent',
      });
      usedTzs.add(retDepTz);
    }
  }

  const colorMap = {
    white: { time: '!text-[#F5F4F1]', label: 'text-[#8A857A]', date: 'text-[#8A857A]' },
    amber: { time: '!text-[#D4A574]', label: 'text-[#C49A6C]/70', date: 'text-[#C49A6C]/50' },
    accent: { time: '!text-[#8BB5A5]', label: 'text-[#8BB5A5]/70', date: 'text-[#8BB5A5]/50' },
  };

  // 단일 시계
  if (clocks.length === 1) {
    return (
      <BentoCard variant="dark">
        <p className="bento-label !text-[#8A857A] mb-2">현재 시간</p>
        <p className="text-3xl bento-value !text-[#F5F4F1]">{fmtTime(now, localTz)}</p>
        <p className="text-xs text-[#8A857A] mt-1.5">{fmtDate(now, localTz)}</p>
      </BentoCard>
    );
  }

  // 복수 시계 (2~3개)
  return (
    <BentoCard variant="dark">
      <div className={`grid grid-cols-${clocks.length} gap-1 text-center`}>
        {clocks.map((c) => {
          const colors = colorMap[c.color];
          const dateHere = fmtDate(now, c.tz);
          const localDate = fmtDate(now, localTz);
          const showDate = dateHere !== localDate; // 날짜가 다른 경우만 별도 표시
          return (
            <div key={c.tz} className="min-w-0">
              <p className={`text-[9px] ${colors.label} mb-1 truncate`}>{c.label}</p>
              <p className={`text-lg bento-value ${colors.time} leading-tight`}>
                {fmtTime(now, c.tz)}
              </p>
              {showDate && (
                <p className={`text-[8px] ${colors.date} mt-0.5 truncate`}>
                  {dateHere}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-[#8A857A] mt-2 text-center">{fmtDate(now, localTz)}</p>
    </BentoCard>
  );
}
