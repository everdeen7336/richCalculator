import { NextRequest, NextResponse } from 'next/server';

/**
 * 날씨 API — 도시명 기반 멀티 로케이션 지원
 *
 * GET /api/weather              → 인천공항 날씨
 * GET /api/weather?city=발리    → 발리 날씨
 * GET /api/weather?city=도쿄    → 도쿄 날씨
 *
 * 환경변수: OPENWEATHER_API_KEY (없으면 시뮬레이션 폴백)
 */

interface CityCoord {
  lat: number;
  lon: number;
  nameKo: string;
  nameEn: string;
  timezone: number; // UTC offset hours
}

/** 주요 여행지 좌표 사전 */
const CITY_COORDS: Record<string, CityCoord> = {
  // 기본
  '인천': { lat: 37.4602, lon: 126.4407, nameKo: '인천공항', nameEn: 'Incheon', timezone: 9 },
  '인천공항': { lat: 37.4602, lon: 126.4407, nameKo: '인천공항', nameEn: 'Incheon', timezone: 9 },

  // 동남아
  '발리': { lat: -8.3405, lon: 115.092, nameKo: '발리', nameEn: 'Bali', timezone: 8 },
  '방콕': { lat: 13.7563, lon: 100.5018, nameKo: '방콕', nameEn: 'Bangkok', timezone: 7 },
  '싱가포르': { lat: 1.3521, lon: 103.8198, nameKo: '싱가포르', nameEn: 'Singapore', timezone: 8 },
  '호치민': { lat: 10.8231, lon: 106.6297, nameKo: '호치민', nameEn: 'Ho Chi Minh', timezone: 7 },
  '하노이': { lat: 21.0285, lon: 105.8542, nameKo: '하노이', nameEn: 'Hanoi', timezone: 7 },
  '다낭': { lat: 16.0544, lon: 108.2022, nameKo: '다낭', nameEn: 'Da Nang', timezone: 7 },
  '세부': { lat: 10.3157, lon: 123.8854, nameKo: '세부', nameEn: 'Cebu', timezone: 8 },
  '보라카이': { lat: 11.9674, lon: 121.9248, nameKo: '보라카이', nameEn: 'Boracay', timezone: 8 },
  '푸켓': { lat: 7.8804, lon: 98.3923, nameKo: '푸켓', nameEn: 'Phuket', timezone: 7 },
  '치앙마이': { lat: 18.7883, lon: 98.9853, nameKo: '치앙마이', nameEn: 'Chiang Mai', timezone: 7 },
  '코타키나발루': { lat: 5.9804, lon: 116.0735, nameKo: '코타키나발루', nameEn: 'Kota Kinabalu', timezone: 8 },
  '쿠알라룸푸르': { lat: 3.1390, lon: 101.6869, nameKo: '쿠알라룸푸르', nameEn: 'Kuala Lumpur', timezone: 8 },

  // 일본
  '도쿄': { lat: 35.6762, lon: 139.6503, nameKo: '도쿄', nameEn: 'Tokyo', timezone: 9 },
  '오사카': { lat: 34.6937, lon: 135.5023, nameKo: '오사카', nameEn: 'Osaka', timezone: 9 },
  '후쿠오카': { lat: 33.5904, lon: 130.4017, nameKo: '후쿠오카', nameEn: 'Fukuoka', timezone: 9 },
  '삿포로': { lat: 43.0618, lon: 141.3545, nameKo: '삿포로', nameEn: 'Sapporo', timezone: 9 },
  '교토': { lat: 35.0116, lon: 135.7681, nameKo: '교토', nameEn: 'Kyoto', timezone: 9 },
  '나고야': { lat: 35.1815, lon: 136.9066, nameKo: '나고야', nameEn: 'Nagoya', timezone: 9 },
  '오키나와': { lat: 26.3344, lon: 127.8056, nameKo: '오키나와', nameEn: 'Okinawa', timezone: 9 },

  // 중국/대만/홍콩
  '상하이': { lat: 31.2304, lon: 121.4737, nameKo: '상하이', nameEn: 'Shanghai', timezone: 8 },
  '베이징': { lat: 39.9042, lon: 116.4074, nameKo: '베이징', nameEn: 'Beijing', timezone: 8 },
  '홍콩': { lat: 22.3193, lon: 114.1694, nameKo: '홍콩', nameEn: 'Hong Kong', timezone: 8 },
  '타이베이': { lat: 25.0330, lon: 121.5654, nameKo: '타이베이', nameEn: 'Taipei', timezone: 8 },
  '마카오': { lat: 22.1987, lon: 113.5439, nameKo: '마카오', nameEn: 'Macau', timezone: 8 },

  // 유럽
  '파리': { lat: 48.8566, lon: 2.3522, nameKo: '파리', nameEn: 'Paris', timezone: 1 },
  '런던': { lat: 51.5074, lon: -0.1278, nameKo: '런던', nameEn: 'London', timezone: 0 },
  '로마': { lat: 41.9028, lon: 12.4964, nameKo: '로마', nameEn: 'Rome', timezone: 1 },
  '바르셀로나': { lat: 41.3874, lon: 2.1686, nameKo: '바르셀로나', nameEn: 'Barcelona', timezone: 1 },
  '프라하': { lat: 50.0755, lon: 14.4378, nameKo: '프라하', nameEn: 'Prague', timezone: 1 },
  '암스테르담': { lat: 52.3676, lon: 4.9041, nameKo: '암스테르담', nameEn: 'Amsterdam', timezone: 1 },
  '뮌헨': { lat: 48.1351, lon: 11.582, nameKo: '뮌헨', nameEn: 'Munich', timezone: 1 },
  '취리히': { lat: 47.3769, lon: 8.5417, nameKo: '취리히', nameEn: 'Zurich', timezone: 1 },
  '이스탄불': { lat: 41.0082, lon: 28.9784, nameKo: '이스탄불', nameEn: 'Istanbul', timezone: 3 },

  // 미주
  '뉴욕': { lat: 40.7128, lon: -74.006, nameKo: '뉴욕', nameEn: 'New York', timezone: -5 },
  '로스앤젤레스': { lat: 34.0522, lon: -118.2437, nameKo: 'LA', nameEn: 'Los Angeles', timezone: -8 },
  'LA': { lat: 34.0522, lon: -118.2437, nameKo: 'LA', nameEn: 'Los Angeles', timezone: -8 },
  '하와이': { lat: 21.3069, lon: -157.8583, nameKo: '하와이', nameEn: 'Hawaii', timezone: -10 },
  '샌프란시스코': { lat: 37.7749, lon: -122.4194, nameKo: '샌프란시스코', nameEn: 'San Francisco', timezone: -8 },
  '시드니': { lat: -33.8688, lon: 151.2093, nameKo: '시드니', nameEn: 'Sydney', timezone: 11 },
  '괌': { lat: 13.4443, lon: 144.7937, nameKo: '괌', nameEn: 'Guam', timezone: 10 },
  '사이판': { lat: 15.1801, lon: 145.7495, nameKo: '사이판', nameEn: 'Saipan', timezone: 10 },

  // 한국 주요 도시
  '제주': { lat: 33.4996, lon: 126.5312, nameKo: '제주', nameEn: 'Jeju', timezone: 9 },
  '부산': { lat: 35.1796, lon: 129.0756, nameKo: '부산', nameEn: 'Busan', timezone: 9 },
  '서울': { lat: 37.5665, lon: 126.978, nameKo: '서울', nameEn: 'Seoul', timezone: 9 },
  '경주': { lat: 35.8562, lon: 129.2248, nameKo: '경주', nameEn: 'Gyeongju', timezone: 9 },
  '강릉': { lat: 37.7519, lon: 128.8761, nameKo: '강릉', nameEn: 'Gangneung', timezone: 9 },
  '여수': { lat: 34.7604, lon: 127.6622, nameKo: '여수', nameEn: 'Yeosu', timezone: 9 },
};

/** 도시명으로 좌표 찾기 (부분 일치) */
function findCity(query: string): CityCoord | null {
  const q = query.trim();
  // 정확한 매치
  if (CITY_COORDS[q]) return CITY_COORDS[q];
  // 부분 매치
  for (const [key, coord] of Object.entries(CITY_COORDS)) {
    if (q.includes(key) || key.includes(q)) return coord;
  }
  return null;
}

export interface WeatherResponse {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  city: string;
  source: 'api' | 'simulated';
}

// 도시별 캐시 (key: cityName)
const cacheMap = new Map<string, { data: WeatherResponse; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

/** 월별 기온 시뮬레이션 데이터 (위도 기반 보정) */
function getSimulatedWeather(coord: CityCoord): WeatherResponse {
  const hour = new Date().getHours();
  const month = new Date().getMonth();

  // 위도 기반 기온 근사 (적도 가까울수록 따뜻)
  const latFactor = Math.abs(coord.lat);
  let baseTemp: number;
  if (latFactor < 15) {
    // 열대 (발리, 싱가포르 등)
    baseTemp = 26 + Math.round((Math.random() - 0.5) * 4);
  } else if (latFactor < 30) {
    // 아열대 (홍콩, 오키나와, 하와이 등)
    const seasonal = [16, 17, 20, 23, 26, 29, 31, 31, 28, 25, 21, 17];
    baseTemp = seasonal[month];
  } else if (latFactor < 45) {
    // 온대 (서울, 도쿄, 파리 등)
    const seasonal = [-2, 0, 5, 12, 18, 23, 26, 27, 22, 15, 8, 1];
    baseTemp = seasonal[month];
  } else {
    // 냉대 (삿포로, 런던 등)
    const seasonal = [-5, -4, 1, 8, 14, 18, 22, 23, 18, 11, 4, -2];
    baseTemp = seasonal[month];
  }

  // 남반구 보정 (시드니 등)
  if (coord.lat < 0) {
    baseTemp = baseTemp + (latFactor < 15 ? 0 : ((month + 6) % 12 - month) * 2);
  }

  const hourOffset = hour >= 6 && hour <= 15 ? 2 : hour >= 16 && hour <= 20 ? 0 : -3;
  const temp = baseTemp + hourOffset + Math.round((Math.random() - 0.5) * 2);

  // 열대 지역 우기 시뮬레이션
  let icon: string;
  if (latFactor < 15) {
    icon = (month >= 10 || month <= 3) ? 'Rain' : 'Clear';
  } else {
    const monthlyWeather = [
      'Snow', 'Snow', 'Clouds', 'Clear', 'Clear', 'Rain',
      'Rain', 'Rain', 'Clear', 'Clear', 'Clouds', 'Snow',
    ];
    icon = monthlyWeather[month];
    if (temp > 20) icon = icon === 'Snow' ? 'Clouds' : icon;
  }

  const descMap: Record<string, string> = {
    Clear: '맑음', Clouds: '흐림', Rain: '비', Snow: '눈',
    Drizzle: '이슬비', Thunderstorm: '천둥번개', Mist: '안개',
  };

  return {
    temp,
    feelsLike: temp - (latFactor < 15 ? -2 : 2), // 열대는 체감 더 높음
    description: descMap[icon] || '맑음',
    icon,
    humidity: latFactor < 15 ? Math.round(70 + Math.random() * 20) : Math.round(40 + Math.random() * 30),
    wind: Math.round(2 + Math.random() * 6),
    city: coord.nameKo,
    source: 'simulated',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cityQuery = searchParams.get('city') || '';
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');

  // 도시 좌표 결정: lat/lon 직접 지정 > city 파라미터 > 기본(인천공항)
  let coord: CityCoord | null = null;

  if (latParam && lonParam) {
    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);
    if (!isNaN(lat) && !isNaN(lon)) {
      // 좌표에서 가장 가까운 도시 찾기
      let nearest: { key: string; dist: number; city: CityCoord } | null = null;
      for (const [key, c] of Object.entries(CITY_COORDS)) {
        const dist = Math.sqrt((c.lat - lat) ** 2 + (c.lon - lon) ** 2);
        if (!nearest || dist < nearest.dist) {
          nearest = { key, dist, city: c };
        }
      }
      // 가까운 도시가 2도(~220km) 이내면 사용, 아니면 좌표 직접 사용
      if (nearest && nearest.dist < 2) {
        coord = nearest.city;
      } else {
        coord = { lat, lon, nameKo: '현재 위치', nameEn: 'Current Location', timezone: 9 };
      }
    }
  }

  if (!coord) {
    coord = cityQuery ? findCity(cityQuery) : CITY_COORDS['인천공항'];
  }

  if (!coord) {
    const fallback = CITY_COORDS['인천공항'];
    const data = getSimulatedWeather(fallback);
    return NextResponse.json(data);
  }

  const cacheKey = coord.nameKo;

  // 캐시 확인
  const cached = cacheMap.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coord.lat}&lon=${coord.lon}&appid=${apiKey}&units=metric&lang=kr`;
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
          city: coord.nameKo,
          source: 'api',
        };
        cacheMap.set(cacheKey, { data, timestamp: Date.now() });
        return NextResponse.json(data);
      }
    } catch {
      // API 실패 시 시뮬레이션 폴백
    }
  }

  const simulated = getSimulatedWeather(coord);
  cacheMap.set(cacheKey, { data: simulated, timestamp: Date.now() });
  return NextResponse.json(simulated);
}
