'use client';

import { useEffect, useState } from 'react';
import BentoCard from './BentoCard';

interface WeatherData {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  source: 'api' | 'simulated';
}

const weatherIcons: Record<string, string> = {
  Clear: '☀️', Clouds: '☁️', Rain: '🌧️', Drizzle: '🌦️',
  Snow: '🌨️', Thunderstorm: '⛈️', Mist: '🌫️', Fog: '🌫️', Haze: '🌫️',
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch('/api/weather');
        if (!res.ok) throw new Error('fetch failed');
        const data: WeatherData = await res.json();
        if (!cancelled) setWeather(data);
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchWeather();
    // 10분마다 갱신
    const id = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!weather && !error) {
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

  if (error || !weather) {
    return (
      <BentoCard>
        <p className="bento-label mb-3">인천공항 날씨</p>
        <p className="text-sm text-[var(--text-muted)]">날씨 정보를 불러올 수 없어요</p>
      </BentoCard>
    );
  }

  return (
    <BentoCard>
      <p className="bento-label mb-3">인천공항 날씨</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl bento-value">{weather.temp}°</p>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{weather.description}</p>
        </div>
        <span className="text-4xl">{weatherIcons[weather.icon] || '🌤️'}</span>
      </div>
      <div className="flex gap-4 mt-4 text-[11px] text-[var(--text-muted)]">
        <span>체감 {weather.feelsLike}°</span>
        <span>습도 {weather.humidity}%</span>
        <span>바람 {weather.wind}m/s</span>
      </div>
    </BentoCard>
  );
}
