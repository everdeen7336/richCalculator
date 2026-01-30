import axios from 'axios';
import * as cheerio from 'cheerio';
import {
  Terminal,
  HourlyInOutData,
  HourlyRouteData,
  CongestionForecast,
  AIRPORT_BASE_URL,
  FORECAST_URLS,
} from '@incheon-dashboard/shared';
import { Logger } from '../utils/logger';

const logger = new Logger('ForecastScraper');

const http = axios.create({
  baseURL: AIRPORT_BASE_URL,
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
});

// 출입국별 페이지 layout 파라미터 (883번 페이지)
const INOUT_LAYOUT = '61705f6b6f40403838334040';
// 노선별 페이지 layout 파라미터 (884번 페이지)
const ROUTE_LAYOUT = '61705f6b6f40403838344040';

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function parseHour(timeStr: string): number {
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : -1;
}

function makeTimeSlot(hour: number): string {
  const h = String(hour).padStart(2, '0');
  const next = String((hour + 1) % 24).padStart(2, '0');
  return `${h}:00~${next}:00`;
}

/**
 * 출입국별 HTML POST로 데이터 가져오기
 * POST /pni/ap_ko/statisticPredictCrowdedOfInout.do
 * 테이블 구조: 시간 | 입국장(A,B / C / D / E,F / 합계) | 출국장(1 / 2 / 3 / 4 / 5,6 / 합계)
 */
async function fetchInOutHtml(
  terminal: Terminal,
  date: string,
): Promise<{ departure: HourlyInOutData['departure'][]; arrival: HourlyInOutData['arrival'][] }> {
  const url = '/pni/ap_ko/statisticPredictCrowdedOfInout.do';
  logger.info(`Fetching InOut HTML: ${url} (${terminal}, ${date})`);

  const response = await http.post(url, `selTm=${terminal}&pday=${date}&layout=${INOUT_LAYOUT}`, {
    responseType: 'text',
  });

  const $ = cheerio.load(response.data as string);

  const departures: HourlyInOutData['departure'][] = [];
  const arrivals: HourlyInOutData['arrival'][] = [];

  // 두 번째 테이블이 시간대별 데이터 (첫 번째는 대기시간)
  const tables = $('table');
  const dataTable = tables.length > 1 ? tables.eq(1) : tables.eq(0);
  const rows = dataTable.find('tr').toArray();

  for (const row of rows) {
    // 시간 셀은 <th>, 데이터 셀은 <td>
    const allCells = $(row).find('th, td');
    if (allCells.length < 12) continue;

    const timeText = allCells.eq(0).text().trim();
    const hour = parseHour(timeText);
    if (hour < 0 || hour > 23) continue;

    // 입국장: A,B(1) / C(2) / D(3) / E,F(4) / 합계(5)
    arrivals.push({
      ab: parseInt(allCells.eq(1).text().replace(/,/g, '').trim(), 10) || 0,
      c: parseInt(allCells.eq(2).text().replace(/,/g, '').trim(), 10) || 0,
      d: parseInt(allCells.eq(3).text().replace(/,/g, '').trim(), 10) || 0,
      ef: parseInt(allCells.eq(4).text().replace(/,/g, '').trim(), 10) || 0,
      total: parseInt(allCells.eq(5).text().replace(/,/g, '').trim(), 10) || 0,
    });

    // 출국장: 1(6) / 2(7) / 3(8) / 4(9) / 5,6(10) / 합계(11)
    departures.push({
      gate1: parseInt(allCells.eq(6).text().replace(/,/g, '').trim(), 10) || 0,
      gate2: parseInt(allCells.eq(7).text().replace(/,/g, '').trim(), 10) || 0,
      gate3: parseInt(allCells.eq(8).text().replace(/,/g, '').trim(), 10) || 0,
      gate4: parseInt(allCells.eq(9).text().replace(/,/g, '').trim(), 10) || 0,
      gate56: parseInt(allCells.eq(10).text().replace(/,/g, '').trim(), 10) || 0,
      total: parseInt(allCells.eq(11).text().replace(/,/g, '').trim(), 10) || 0,
    });
  }

  logger.info(`InOut parsed: ${departures.length} departure hours, ${arrivals.length} arrival hours`);
  return { departure: departures, arrival: arrivals };
}

/**
 * 노선별 HTML POST로 데이터 가져오기
 * POST /pni/ap_ko/statisticPredictCrowdedOfRoute.do
 * 테이블 구조: 시간 | 일본 | 중국 | 동남아 | 미주 | 유럽 | 오세아니아 | 기타
 */
async function fetchRouteHtml(terminal: Terminal, date: string): Promise<HourlyRouteData[]> {
  const url = '/pni/ap_ko/statisticPredictCrowdedOfRoute.do';
  logger.info(`Fetching Route HTML: ${url} (${terminal}, ${date})`);

  const response = await http.post(url, `selTm=${terminal}&pday=${date}&layout=${ROUTE_LAYOUT}`, {
    responseType: 'text',
  });

  const $ = cheerio.load(response.data as string);

  const routes: HourlyRouteData[] = [];
  const rows = $('table tr').toArray();

  for (const row of rows) {
    // 시간 셀은 <th>, 데이터 셀은 <td>
    const allCells = $(row).find('th, td');
    if (allCells.length < 8) continue;

    const timeText = allCells.eq(0).text().trim();
    const hour = parseHour(timeText);
    if (hour < 0 || hour > 23) continue;

    routes.push({
      hour,
      timeSlot: makeTimeSlot(hour),
      japan: parseInt(allCells.eq(1).text().replace(/,/g, '').trim(), 10) || 0,
      china: parseInt(allCells.eq(2).text().replace(/,/g, '').trim(), 10) || 0,
      southeastAsia: parseInt(allCells.eq(3).text().replace(/,/g, '').trim(), 10) || 0,
      northAmerica: parseInt(allCells.eq(4).text().replace(/,/g, '').trim(), 10) || 0,
      europe: parseInt(allCells.eq(5).text().replace(/,/g, '').trim(), 10) || 0,
      oceania: parseInt(allCells.eq(6).text().replace(/,/g, '').trim(), 10) || 0,
      other: parseInt(allCells.eq(7).text().replace(/,/g, '').trim(), 10) || 0,
    });
  }

  // Deduplicate by hour
  const seen = new Set<number>();
  const deduped = routes
    .filter((r) => {
      if (seen.has(r.hour)) return false;
      seen.add(r.hour);
      return true;
    })
    .sort((a, b) => a.hour - b.hour);

  logger.info(`Route parsed: ${deduped.length} hours`);
  return deduped;
}

export async function scrapeForecast(terminal: Terminal, date?: string): Promise<CongestionForecast> {
  const targetDate = date || getTodayDate();
  logger.info(`Scraping forecast for ${terminal}, date: ${targetDate}`);

  const [inOutResult, routeResult] = await Promise.allSettled([
    fetchInOutHtml(terminal, targetDate),
    fetchRouteHtml(terminal, targetDate),
  ]);

  const inOut = inOutResult.status === 'fulfilled' ? inOutResult.value : { departure: [], arrival: [] };
  const routes = routeResult.status === 'fulfilled' ? routeResult.value : [];

  if (inOutResult.status === 'rejected') {
    logger.error('Failed to fetch InOut data', inOutResult.reason);
  }
  if (routeResult.status === 'rejected') {
    logger.error('Failed to fetch Route data', routeResult.reason);
  }

  // Combine into HourlyInOutData
  const inOutData: HourlyInOutData[] = [];
  for (let h = 0; h < 24; h++) {
    inOutData.push({
      hour: h,
      timeSlot: makeTimeSlot(h),
      departure: inOut.departure[h] || { gate1: 0, gate2: 0, gate3: 0, gate4: 0, gate56: 0, total: 0 },
      arrival: inOut.arrival[h] || { ab: 0, c: 0, d: 0, ef: 0, total: 0 },
    });
  }

  // Summary
  const totalDeparture = inOutData.reduce((sum, d) => sum + d.departure.total, 0);
  const totalArrival = inOutData.reduce((sum, d) => sum + d.arrival.total, 0);

  const peakDep = inOutData.reduce((max, d) => (d.departure.total > max.departure.total ? d : max), inOutData[0]);
  const peakArr = inOutData.reduce((max, d) => (d.arrival.total > max.arrival.total ? d : max), inOutData[0]);

  return {
    terminal,
    date: targetDate,
    inOutData,
    routeData: routes,
    summary: {
      totalDeparture,
      totalArrival,
      peakDepartureHour: peakDep.hour,
      peakDepartureCount: peakDep.departure.total,
      peakArrivalHour: peakArr.hour,
      peakArrivalCount: peakArr.arrival.total,
    },
    lastUpdated: new Date().toISOString(),
  };
}
