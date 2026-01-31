import { NextResponse } from 'next/server';

/**
 * 인천공항 날씨 API (OpenWeatherMap 또는 기상청 연동)
 *
 * 환경변수: OPENWEATHER_API_KEY
 * 인천공항 좌표: 37.4602, 126.4407
 *
 * API 키가 없으면 시간 기반 시뮬레이션 폴백
 */

const ICN_LAT = 37.4602;
const ICN_LON = 126.4407;

interface WeatherResponse {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  source: 'api' | 'simulated';
}

// 10분 캐시
let cache: { data: WeatherResponse; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

function getSimulatedWeather(): WeatherResponse {
  const hour = new Date().getHours();
  const month = new Date().getMonth(); // 0-11

  // 월별 기온 근사치 (인천)
  const monthlyAvg = [-3, -1, 4, 11, 17, 22, 25, 26, 21, 14, 7, 0];
  const baseTemp = monthlyAvg[month];
  const hourOffset = hour >= 6 && hour <= 15 ? 3 : hour >= 16 && hour <= 20 ? 1 : -2;
  const temp = baseTemp + hourOffset + Math.round((Math.random() - 0.5) * 2);

  // 월별 대표 날씨
  const monthlyWeather = [
    'Snow', 'Snow', 'Clouds', 'Clear', 'Clear', 'Rain',
    'Rain', 'Rain', 'Clear', 'Clear', 'Clouds', 'Snow',
  ];
  const icon = monthlyWeather[month];

  const descMap: Record<string, string> = {
    Clear: '맑음', Clouds: '흐림', Rain: '비', Snow: '눈',
    Drizzle: '이슬비', Thunderstorm: '천둥번개', Mist: '안개',
  };

  return {
    temp,
    feelsLike: temp - 2,
    description: descMap[icon] || '맑음',
    icon,
    humidity: Math.round(45 + Math.random() * 30),
    wind: Math.round(2 + Math.random() * 6),
    source: 'simulated',
  };
}

export async function GET() {
  // 캐시 확인
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${ICN_LAT}&lon=${ICN_LON}&appid=${apiKey}&units=metric&lang=kr`;
      const res = await fetch(url, { next: { revalidate: 600 } });

      if (res.ok) {
        const json = await res.json();
        const data: WeatherResponse = {
          temp: Math.round(json.main.temp),
          feelsLike: Math.round(json.main.feels_like),
          description: json.weather[0].description,
          icon: json.weather[0].main,
          humidity: json.main.humidity,
          wind: Math.round(json.wind.speed),
          source: 'api',
        };
        cache = { data, timestamp: Date.now() };
        return NextResponse.json(data);
      }
    } catch {
      // API 실패 시 시뮬레이션 폴백
    }
  }

  const simulated = getSimulatedWeather();
  cache = { data: simulated, timestamp: Date.now() };
  return NextResponse.json(simulated);
}
