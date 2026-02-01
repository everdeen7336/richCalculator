import { NextRequest, NextResponse } from 'next/server';

/**
 * 비행편 조회 API
 *
 * GET /api/flight?number=KE431&date=2026-01-26&origin=ICN
 *
 * 외부 API 우선순위:
 *   1. AviationStack  (AVIATIONSTACK_API_KEY)
 *   2. AirLabs        (AIRLABS_API_KEY)
 *   3. AeroDataBox    (AERODATABOX_API_KEY — RapidAPI)
 *
 * 모든 API 실패 시 → 에러 반환 (잘못된 시뮬레이션 데이터 제공 안 함)
 */

interface FlightResponse {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    scheduledTime: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: string;
    city: string;
    scheduledTime: string;
    terminal?: string;
  };
  status: string;
  durationMinutes: number;
  source: string;
}

/** 항공사 코드 → 이름 (표시용, 터미널은 ICN 기준) */
const AIRLINES: Record<string, { name: string; terminal: string }> = {
  'KE': { name: '대한항공', terminal: 'T2' },
  'OZ': { name: '아시아나항공', terminal: 'T1' },
  'LJ': { name: '진에어', terminal: 'T2' },
  'TW': { name: '티웨이항공', terminal: 'T1' },
  '7C': { name: '제주항공', terminal: 'T1' },
  'BX': { name: '에어부산', terminal: 'T1' },
  'RS': { name: '에어서울', terminal: 'T1' },
  'ZE': { name: '이스타항공', terminal: 'T1' },
  'RF': { name: '에어로케이', terminal: 'T1' },
  'NH': { name: 'ANA', terminal: 'T1' },
  'JL': { name: 'JAL', terminal: 'T1' },
  'CX': { name: '캐세이퍼시픽', terminal: 'T1' },
  'SQ': { name: '싱가포르항공', terminal: 'T1' },
  'TG': { name: '타이항공', terminal: 'T1' },
  'GA': { name: '가루다인도네시아', terminal: 'T1' },
  'VN': { name: '베트남항공', terminal: 'T1' },
  'QR': { name: '카타르항공', terminal: 'T1' },
  'EK': { name: '에미레이트', terminal: 'T1' },
  'AA': { name: '아메리칸항공', terminal: 'T1' },
  'UA': { name: '유나이티드', terminal: 'T1' },
  'DL': { name: '델타항공', terminal: 'T1' },
  'AF': { name: '에어프랑스', terminal: 'T1' },
  'LH': { name: '루프트한자', terminal: 'T1' },
  'BA': { name: '브리티시항공', terminal: 'T1' },
  'MU': { name: '중국동방항공', terminal: 'T1' },
  'CA': { name: '중국국제항공', terminal: 'T1' },
  'CI': { name: '중화항공', terminal: 'T1' },
  'BR': { name: '에바항공', terminal: 'T1' },
  'MM': { name: '피치항공', terminal: 'T1' },
  'QZ': { name: '에어아시아', terminal: 'T1' },
};

/** 공항 코드 → 도시명 (API 응답 보완용) */
const AIRPORT_CITY: Record<string, string> = {
  'ICN': '인천', 'GMP': '서울(김포)', 'PUS': '부산', 'CJU': '제주', 'TAE': '대구',
  'NRT': '도쿄(나리타)', 'HND': '도쿄(하네다)', 'KIX': '오사카', 'FUK': '후쿠오카',
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

/** 편명 파싱 */
function parseFlightNumber(raw: string): { airline: string; number: number; iata: string } | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  const match = cleaned.match(/^([A-Z0-9]{2})(\d{1,4})$/);
  if (!match) return null;
  return { airline: match[1], number: parseInt(match[2]), iata: cleaned };
}

function resolveCity(airportCode: string, fallback?: string): string {
  return AIRPORT_CITY[airportCode] || fallback || airportCode;
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    scheduled: 'scheduled', active: 'in_air', en_route: 'in_air',
    landed: 'landed', cancelled: 'cancelled',
    incident: 'delayed', diverted: 'delayed', delayed: 'delayed',
  };
  return map[status?.toLowerCase()] || 'scheduled';
}

// ── 캐시 (편명+날짜 → 결과, 15분) ──
const cache = new Map<string, { data: FlightResponse; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000;

// ────────────────────────────────────────
// API Provider 1: AviationStack
// ────────────────────────────────────────
async function tryAviationStack(
  iata: string, dateStr: string | undefined, airlineCode: string
): Promise<FlightResponse | null> {
  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) return null;

  try {
    let url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${iata}`;
    if (dateStr) url += `&flight_date=${dateStr}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const json = await res.json();

    // 여러 결과 중 요청 날짜와 일치하는 것 선택
    const flights = json.data;
    if (!Array.isArray(flights) || flights.length === 0) return null;

    let flight = flights[0];
    if (dateStr && flights.length > 1) {
      const matched = flights.find((f: Record<string, Record<string, string>>) => {
        const depDate = (f.departure?.scheduled || '').split('T')[0];
        return depDate === dateStr;
      });
      if (matched) flight = matched;
    }

    // 날짜 검증: API 응답 날짜가 요청 날짜와 다르면 사용하지 않음
    if (dateStr && flight.departure?.scheduled) {
      const resultDate = flight.departure.scheduled.split('T')[0];
      if (resultDate !== dateStr) return null;
    }

    const depAirport = flight.departure?.iata || '';
    const arrAirport = flight.arrival?.iata || '';

    const data: FlightResponse = {
      flightNumber: iata,
      airline: flight.airline?.name || AIRLINES[airlineCode]?.name || airlineCode,
      departure: {
        airport: depAirport,
        city: resolveCity(depAirport, flight.departure?.timezone?.split('/')?.pop()),
        scheduledTime: flight.departure?.scheduled || '',
        terminal: flight.departure?.terminal || undefined,
        gate: flight.departure?.gate || undefined,
      },
      arrival: {
        airport: arrAirport,
        city: resolveCity(arrAirport, flight.arrival?.timezone?.split('/')?.pop()),
        scheduledTime: flight.arrival?.scheduled || '',
        terminal: flight.arrival?.terminal || undefined,
      },
      status: mapStatus(flight.flight_status),
      durationMinutes: 0,
      source: 'aviationstack',
    };

    if (data.departure.scheduledTime && data.arrival.scheduledTime) {
      data.durationMinutes = Math.round(
        (new Date(data.arrival.scheduledTime).getTime() -
         new Date(data.departure.scheduledTime).getTime()) / 60000
      );
    }
    return data;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────
// API Provider 2: AirLabs
// ────────────────────────────────────────
async function tryAirLabs(
  iata: string, dateStr: string | undefined, airlineCode: string
): Promise<FlightResponse | null> {
  const apiKey = process.env.AIRLABS_API_KEY;
  if (!apiKey) return null;

  try {
    // schedules 엔드포인트: flight_iata 파라미터로 조회 (airline_iata+flight_number 조합보다 정확)
    const url = `https://airlabs.co/api/v9/schedules?api_key=${apiKey}&flight_iata=${iata}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const json = await res.json();
    const schedules = json.response;
    if (!Array.isArray(schedules) || schedules.length === 0) return null;

    // 요청한 편명과 정확히 일치하는 스케줄 찾기
    const exactMatch = schedules.find((s: Record<string, string>) =>
      s.flight_iata === iata || s.flight_number === iata.slice(2)
    );
    const f = exactMatch || schedules[0];

    // schedules API는 오늘 기준 데이터만 반환하므로,
    // 미래 날짜 요청 시 시간 정보를 요청 날짜에 맞춰 조정
    let depTime = f.dep_time || '';
    let arrTime = f.arr_time || '';
    if (dateStr && depTime) {
      const origDepDate = depTime.includes('T') ? depTime.split('T')[0] : depTime.split(' ')[0];
      if (origDepDate !== dateStr) {
        // 날짜 부분만 교체 (시간은 동일 스케줄이므로 유지)
        const depTimePart = depTime.includes('T') ? depTime.split('T')[1] : depTime.split(' ')[1];
        const arrTimePart = arrTime.includes('T') ? arrTime.split('T')[1] : arrTime.split(' ')[1];
        depTime = `${dateStr} ${depTimePart || ''}`.trim();
        // 도착이 다음날인 경우 처리
        if (arrTime) {
          const origArrDate = arrTime.includes('T') ? arrTime.split('T')[0] : arrTime.split(' ')[0];
          const dayDiff = Math.round(
            (new Date(origArrDate).getTime() - new Date(origDepDate).getTime()) / 86400000
          );
          const arrDate = new Date(dateStr);
          arrDate.setDate(arrDate.getDate() + dayDiff);
          const arrDateStr = arrDate.toISOString().split('T')[0];
          arrTime = `${arrDateStr} ${arrTimePart || ''}`.trim();
        }
      }
    }

    const depAirport = f.dep_iata || '';
    const arrAirport = f.arr_iata || '';

    return {
      flightNumber: iata,
      airline: AIRLINES[airlineCode]?.name || airlineCode,
      departure: {
        airport: depAirport,
        city: resolveCity(depAirport),
        scheduledTime: depTime || f.dep_estimated || '',
        terminal: f.dep_terminal || undefined,
        gate: f.dep_gate || undefined,
      },
      arrival: {
        airport: arrAirport,
        city: resolveCity(arrAirport),
        scheduledTime: arrTime || f.arr_estimated || '',
        terminal: f.arr_terminal || undefined,
      },
      status: mapStatus(f.status || 'scheduled'),
      durationMinutes: f.duration || 0,
      source: 'airlabs',
    };
  } catch {
    return null;
  }
}

// ────────────────────────────────────────
// API Provider 3: AeroDataBox (RapidAPI)
// ────────────────────────────────────────
async function tryAeroDataBox(
  iata: string, dateStr: string | undefined, airlineCode: string
): Promise<FlightResponse | null> {
  const apiKey = process.env.AERODATABOX_API_KEY;
  if (!apiKey) return null;

  try {
    const date = dateStr || new Date().toISOString().split('T')[0];
    const url = `https://aerodatabox.p.rapidapi.com/flights/number/${iata}/${date}`;
    const res = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const f = Array.isArray(json) ? json[0] : null;
    if (!f) return null;

    const depAirport = f.departure?.airport?.iata || '';
    const arrAirport = f.arrival?.airport?.iata || '';

    const depTime = f.departure?.scheduledTime?.utc || f.departure?.scheduledTime?.local || '';
    const arrTime = f.arrival?.scheduledTime?.utc || f.arrival?.scheduledTime?.local || '';

    const data: FlightResponse = {
      flightNumber: iata,
      airline: f.airline?.name || AIRLINES[airlineCode]?.name || airlineCode,
      departure: {
        airport: depAirport,
        city: resolveCity(depAirport, f.departure?.airport?.name),
        scheduledTime: depTime,
        terminal: f.departure?.terminal || undefined,
        gate: f.departure?.gate || undefined,
      },
      arrival: {
        airport: arrAirport,
        city: resolveCity(arrAirport, f.arrival?.airport?.name),
        scheduledTime: arrTime,
        terminal: f.arrival?.terminal || undefined,
      },
      status: mapStatus(f.status || 'scheduled'),
      durationMinutes: 0,
      source: 'aerodatabox',
    };

    if (depTime && arrTime) {
      data.durationMinutes = Math.round(
        (new Date(arrTime).getTime() - new Date(depTime).getTime()) / 60000
      );
    }
    return data;
  } catch {
    return null;
  }
}

// ────────────────────────────────────────
// GET Handler
// ────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const numberParam = searchParams.get('number');
  const dateParam = searchParams.get('date') || undefined;

  if (!numberParam) {
    return NextResponse.json(
      { error: '편명을 입력해주세요 (예: KE431)' },
      { status: 400 }
    );
  }

  const parsed = parseFlightNumber(numberParam);
  if (!parsed) {
    return NextResponse.json(
      { error: '유효하지 않은 편명 형식입니다 (예: KE431, OZ761, 7C101)' },
      { status: 400 }
    );
  }

  // 과거 날짜 체크 — 대부분의 무료 API는 과거 운항 정보를 제공하지 않음
  if (dateParam) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reqDate = new Date(dateParam + 'T00:00:00');
    if (reqDate.getTime() < today.getTime()) {
      return NextResponse.json(
        {
          error: `${dateParam}은 과거 날짜입니다.`,
          suggestion: '무료 항공편 API는 과거 운항 정보를 제공하지 않습니다. 오늘 이후 날짜를 입력해주세요.',
        },
        { status: 400 }
      );
    }
  }

  const cacheKey = `${parsed.iata}_${dateParam || 'today'}`;

  // 캐시 확인
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  // ── API 순차 시도 ──
  const result =
    (await tryAviationStack(parsed.iata, dateParam, parsed.airline)) ||
    (await tryAirLabs(parsed.iata, dateParam, parsed.airline)) ||
    (await tryAeroDataBox(parsed.iata, dateParam, parsed.airline));

  if (result) {
    // ICN 터미널 보완 (API가 미제공 시)
    if (!result.departure.terminal && result.departure.airport === 'ICN') {
      result.departure.terminal = AIRLINES[parsed.airline]?.terminal || 'T1';
    }

    cache.set(cacheKey, { data: result, timestamp: Date.now() });
    return NextResponse.json(result);
  }

  // ── 모든 API 실패 ──
  const hasAnyKey = !!(
    process.env.AVIATIONSTACK_API_KEY ||
    process.env.AIRLABS_API_KEY ||
    process.env.AERODATABOX_API_KEY
  );

  return NextResponse.json(
    {
      error: hasAnyKey
        ? `${parsed.iata} 편의 ${dateParam || '오늘'} 운항 정보를 찾을 수 없습니다. 편명과 날짜를 확인해주세요.`
        : '항공편 조회 API 키가 설정되지 않았습니다. 환경변수에 AVIATIONSTACK_API_KEY, AIRLABS_API_KEY, 또는 AERODATABOX_API_KEY 중 하나를 설정해주세요.',
      suggestion: hasAnyKey
        ? '편명 또는 날짜가 정확한지 확인해주세요. 운항하지 않는 날짜이거나 코드쉐어 편명일 수 있습니다.'
        : '무료: aviationstack.com (100회/월), airlabs.co (1000회/월)',
    },
    { status: hasAnyKey ? 404 : 503 }
  );
}
