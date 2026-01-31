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

export default function WeatherWidget() {
  const [localWeather, setLocalWeather] = useState<WeatherData | null>(null);
  const [destWeather, setDestWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);
  const { destination } = useJourneyStore();

  const fetchWeatherFor = useCallback(async (city?: string): Promise<WeatherData | null> => {
    try {
      const url = city ? `/api/weather?city=${encodeURIComponent(city)}` : '/api/weather';
      const res = await fetch(url);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  // 인천공항 날씨 (항상)
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const data = await fetchWeatherFor();
      if (!cancelled) {
        if (data) setLocalWeather(data);
        else setError(true);
      }
    }
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [fetchWeatherFor]);

  // 목적지 날씨 (destination 변경 시)
  useEffect(() => {
    if (!destination) {
      setDestWeather(null);
      return;
    }
    let cancelled = false;
    async function load() {
      const data = await fetchWeatherFor(destination);
      if (!cancelled) {
        // 인천과 같은 도시면 중복 표시 안 함
        if (data && data.city !== '인천공항') {
          setDestWeather(data);
        } else {
          setDestWeather(null);
        }
      }
    }
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, [destination, fetchWeatherFor]);

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
        <p className="text-sm text-[var(--text-muted)]">날씨 정보를 불러올 수 없어요</p>
      </BentoCard>
    );
  }

  // ── 목적지 날씨가 있으면 2개 비교 표시 ──
  if (destWeather) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">날씨</p>

        {/* 두 도시 비교 */}
        <div className="space-y-3">
          {/* 인천공항 (출발지) */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--text-muted)]">{localWeather.city}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl bento-value">{localWeather.temp}°</span>
                <span className="text-xs text-[var(--text-secondary)]">{localWeather.description}</span>
              </div>
            </div>
            <span className="text-2xl flex-shrink-0">{weatherIcons[localWeather.icon] || '🌤️'}</span>
          </div>

          {/* 구분선 + 비행기 아이콘 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-[var(--border-light)]" />
            <span className="text-[10px] text-[var(--text-muted)]">✈︎</span>
            <div className="flex-1 h-px bg-[var(--border-light)]" />
          </div>

          {/* 목적지 */}
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--accent)] font-medium">{destWeather.city}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl bento-value">{destWeather.temp}°</span>
                <span className="text-xs text-[var(--text-secondary)]">{destWeather.description}</span>
              </div>
            </div>
            <span className="text-2xl flex-shrink-0">{weatherIcons[destWeather.icon] || '🌤️'}</span>
          </div>

          {/* 기온차 힌트 */}
          {(() => {
            const diff = destWeather.temp - localWeather.temp;
            if (Math.abs(diff) < 3) return null;
            return (
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                {diff > 0
                  ? `${destWeather.city}이 ${diff}° 더 따뜻해요`
                  : `${destWeather.city}이 ${Math.abs(diff)}° 더 서늘해요`}
              </p>
            );
          })()}
        </div>
      </BentoCard>
    );
  }

  // ── 기본: 인천공항만 ──
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
