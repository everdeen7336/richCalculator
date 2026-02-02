'use client';

import { useEffect, useState, useCallback } from 'react';
import BentoCard from './BentoCard';
import { useJourneyStore } from '@/stores/journey.store';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  city: string;
  source: 'api' | 'simulated';
}

const weatherIcons: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '🌨️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
};

/** 공항 코드 → 날씨 API에 보낼 도시명 */
const AIRPORT_WEATHER_CITY: Record<string, string> = {
  'ICN': '인천', 'GMP': '서울', 'PUS': '부산', 'CJU': '제주', 'TAE': '대구',
  'NRT': '도쿄', 'HND': '도쿄', 'KIX': '오사카', 'FUK': '후쿠오카',
  'CTS': '삿포로', 'OKA': '오키나와',
  'BKK': '방콕', 'HKT': '푸켓', 'CNX': '치앙마이',
  'SIN': '싱가포르', 'KUL': '쿠알라룸푸르',
  'HKG': '홍콩', 'TPE': '타이베이',
  'PVG': '상하이', 'PEK': '베이징',
  'DPS': '발리', 'CGK': '자카르타',
  'SGN': '호치민', 'HAN': '하노이', 'DAD': '다낭',
  'CEB': '세부', 'MNL': '마닐라',
  'CDG': '파리', 'LHR': '런던', 'FCO': '로마', 'IST': '이스탄불',
  'FRA': '프랑크푸르트', 'AMS': '암스테르담', 'BCN': '바르셀로나',
  'JFK': '뉴욕', 'LAX': 'LA', 'SFO': '샌프란시스코',
  'HNL': '하와이', 'GUM': '괌', 'SPN': '사이판',
  'SYD': '시드니', 'MEL': '멜버른',
  'DXB': '두바이', 'DOH': '도하',
};

function resolveWeatherCity(city?: string, airport?: string): string | null {
  if (airport && AIRPORT_WEATHER_CITY[airport]) return AIRPORT_WEATHER_CITY[airport];
  if (city) return city;
  return null;
}

export default function WeatherWidget() {
  const [localWeather, setLocalWeather] = useState<WeatherData | null>(null);
  const [depWeather, setDepWeather] = useState<WeatherData | null>(null);
  const [arrWeather, setArrWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lon: number } | null>(null);
  const { departureFlight, returnFlight, destination } = useJourneyStore();
  const activeFlight = departureFlight || returnFlight;

  // 브라우저 위치 정보 (한 번만)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}, // 실패 시 기본 인천
      { timeout: 5000, maximumAge: 600000 }
    );
  }, []);

  const fetchWeatherFor = useCallback(async (city?: string, coords?: { lat: number; lon: number }): Promise<WeatherData | null> => {
    try {
      let url = '/api/weather';
      if (coords) {
        url = `/api/weather?lat=${coords.lat}&lon=${coords.lon}`;
      } else if (city) {
        url = `/api/weather?city=${encodeURIComponent(city)}`;
      }
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // 1) 내 현재 위치 날씨 (기본)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = geoCoords
        ? await fetchWeatherFor(undefined, geoCoords)
        : await fetchWeatherFor();
      if (!cancelled) {
        if (data) setLocalWeather(data);
        else setError(true);
      }
    }
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [fetchWeatherFor, geoCoords]);

  // 2) 출발 공항 날씨 (출국편 or 귀국편)
  useEffect(() => {
    if (!activeFlight) { setDepWeather(null); return; }
    const city = resolveWeatherCity(activeFlight.departure.city, activeFlight.departure.airport);
    if (!city || city === localWeather?.city) { setDepWeather(null); return; }

    let cancelled = false;
    async function load() {
      const data = await fetchWeatherFor(city!);
      if (!cancelled && data && data.city !== localWeather?.city) setDepWeather(data);
    }
    load();
    return () => { cancelled = true; };
  }, [activeFlight, fetchWeatherFor, localWeather?.city]);

  // 3) 도착지 날씨 (출국편 도착지 → 귀국편 도착지 → destination)
  useEffect(() => {
    const arrCity = departureFlight
      ? resolveWeatherCity(departureFlight.arrival.city, departureFlight.arrival.airport)
      : returnFlight
        ? resolveWeatherCity(returnFlight.arrival.city, returnFlight.arrival.airport)
        : destination || null;
    if (!arrCity) { setArrWeather(null); return; }
    if (arrCity === localWeather?.city || arrCity === depWeather?.city) { setArrWeather(null); return; }

    let cancelled = false;
    async function load() {
      const data = await fetchWeatherFor(arrCity!);
      if (!cancelled && data && data.city !== localWeather?.city && data.city !== depWeather?.city) {
        setArrWeather(data);
      }
    }
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [departureFlight, returnFlight, destination, fetchWeatherFor, localWeather?.city, depWeather?.city]);

  // ── Loading ──
  if (!localWeather && !error) {
    return (
      <BentoCard>
        <div className="animate-pulse space-y-2">
          <div className="h-3 bg-[var(--border)] rounded w-20" />
          <div className="h-8 bg-[var(--border)] rounded w-16 mt-2" />
          <div className="h-3 bg-[var(--border)] rounded w-24 mt-2" />
        </div>
      </BentoCard>
    );
  }

  // ── Error ──
  if (error || !localWeather) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">날씨</p>
        <p className="text-sm text-[var(--text-muted)]">날씨 정보를 준비 중이에요</p>
      </BentoCard>
    );
  }

  // 표시할 날씨 목록 구성
  const weatherItems: { data: WeatherData; role: 'local' | 'departure' | 'arrival' }[] = [
    { data: localWeather, role: 'local' },
  ];
  if (depWeather) weatherItems.push({ data: depWeather, role: 'departure' });
  if (arrWeather) weatherItems.push({ data: arrWeather, role: 'arrival' });

  // ── 단일 (내 위치만) ──
  if (weatherItems.length === 1) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">{localWeather.city} 날씨</p>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl bento-value">{localWeather.temp}°</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{localWeather.description}</p>
          </div>
          <span className="text-4xl">{weatherIcons[localWeather.icon] || '🌤️'}</span>
        </div>
        <div className="flex gap-4 mt-4 text-[11px] text-[var(--text-muted)]">
          <span>체감 {localWeather.feelsLike}°</span>
          <span>습도 {localWeather.humidity}%</span>
          <span>바람 {localWeather.wind}m/s</span>
        </div>
      </BentoCard>
    );
  }

  // ── 복수 도시 비교 ──
  const roleLabel = { local: '📍 현재', departure: '🛫 출발지', arrival: '🛬 도착지' };
  const roleColor = {
    local: 'text-[var(--text-muted)]',
    departure: 'text-[#C49A6C]',
    arrival: 'text-[var(--accent)]',
  };

  return (
    <BentoCard>
      <p className="bento-label mb-3">날씨</p>
      <div className="space-y-2.5">
        {weatherItems.map((item, idx) => (
          <div key={item.data.city}>
            {idx > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-px bg-[var(--border-light)]" />
                <span className="text-[10px] text-[var(--text-muted)]">
                  {item.role === 'arrival' ? '✈︎' : '·'}
                </span>
                <div className="flex-1 h-px bg-[var(--border-light)]" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className={`text-[10px] ${roleColor[item.role]} font-medium`}>
                  {roleLabel[item.role]}
                </p>
                <p className={`text-[11px] ${item.role === 'arrival' ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'} font-medium`}>
                  {item.data.city}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl bento-value">{item.data.temp}°</span>
                  <span className="text-xs text-[var(--text-secondary)]">{item.data.description}</span>
                </div>
              </div>
              <span className="text-2xl flex-shrink-0">{weatherIcons[item.data.icon] || '🌤️'}</span>
            </div>
          </div>
        ))}

        {/* 기온차 힌트 (현재 vs 도착지) */}
        {arrWeather && (() => {
          const diff = arrWeather.temp - localWeather.temp;
          if (Math.abs(diff) < 3) return null;
          return (
            <p className="text-[10px] text-[var(--text-muted)] text-center pt-1">
              {diff > 0
                ? `${arrWeather.city}이 ${diff}° 더 따뜻해요`
                : `${arrWeather.city}이 ${Math.abs(diff)}° 더 서늘해요`}
            </p>
          );
        })()}
      </div>
    </BentoCard>
  );
}
