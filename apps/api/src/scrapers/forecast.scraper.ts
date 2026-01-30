import axios from 'axios';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';
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
    'User-Agent': 'IncheonAirportDashboard/1.0',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  },
  responseType: 'arraybuffer',
});

function getTerminalParam(terminal: Terminal): string {
  return terminal; // T1, T2
}

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

async function fetchInOutExcel(terminal: Terminal, date: string): Promise<{ departure: HourlyInOutData['departure'][]; arrival: HourlyInOutData['arrival'][] }> {
  const url = `${FORECAST_URLS.INOUT_EXCEL}?selTm=${getTerminalParam(terminal)}&pday=${date}`;
  logger.info(`Fetching InOut excel: ${url}`);

  const response = await http.get(url, { responseType: 'arraybuffer' });
  const workbook = XLSX.read(response.data, { type: 'buffer' });

  // Sheet 0: 출국승객예고 - rows 20-43 are hourly departure data
  const departureSheet = workbook.Sheets[workbook.SheetNames[0]];
  const depData = XLSX.utils.sheet_to_json<(string | number)[]>(departureSheet, { header: 1 });

  const departures: HourlyInOutData['departure'][] = [];
  // Find the hourly data section (starts with "0~1시" pattern)
  let depStartRow = -1;
  for (let i = 0; i < depData.length; i++) {
    const firstCell = String(depData[i]?.[0] ?? '');
    if (firstCell.match(/^0~1/)) {
      depStartRow = i;
      break;
    }
  }

  if (depStartRow >= 0) {
    for (let h = 0; h < 24; h++) {
      const row = depData[depStartRow + h];
      if (!row) break;
      departures.push({
        gate1: Number(row[1]) || 0,
        gate2: Number(row[2]) || 0,
        gate3: Number(row[3]) || 0,
        gate4: Number(row[4]) || 0,
        gate56: Number(row[5]) || 0,
        total: Number(row[6]) || 0,
      });
    }
  }

  // Sheet 1: 입국승객예고
  const arrivalSheet = workbook.Sheets[workbook.SheetNames[1]];
  const arrData = XLSX.utils.sheet_to_json<(string | number)[]>(arrivalSheet, { header: 1 });

  const arrivals: HourlyInOutData['arrival'][] = [];
  let arrStartRow = -1;
  for (let i = 0; i < arrData.length; i++) {
    const firstCell = String(arrData[i]?.[0] ?? '');
    if (firstCell.match(/^0~1/)) {
      arrStartRow = i;
      break;
    }
  }

  if (arrStartRow >= 0) {
    for (let h = 0; h < 24; h++) {
      const row = arrData[arrStartRow + h];
      if (!row) break;
      arrivals.push({
        ab: Number(row[1]) || 0,
        c: Number(row[2]) || 0,
        d: Number(row[3]) || 0,
        ef: Number(row[4]) || 0,
        total: Number(row[5]) || 0,
      });
    }
  }

  return { departure: departures, arrival: arrivals };
}

async function fetchRouteHtml(terminal: Terminal, date: string): Promise<HourlyRouteData[]> {
  const url = `${FORECAST_URLS.ROUTE_HTML}?selTm=${getTerminalParam(terminal)}&pday=${date}&layout=61705f6b6f40403838344040`;
  logger.info(`Fetching Route HTML: ${url}`);

  const response = await http.get(url, { responseType: 'text' });
  const $ = cheerio.load(response.data as string);

  const routes: HourlyRouteData[] = [];
  const rows = $('table tbody tr, table tr').toArray();

  for (const row of rows) {
    const cells = $(row).find('td');
    if (cells.length < 8) continue;

    const timeText = cells.eq(0).text().trim();
    const hour = parseHour(timeText);
    if (hour < 0 || hour > 23) continue;

    routes.push({
      hour,
      timeSlot: makeTimeSlot(hour),
      japan: parseInt(cells.eq(1).text().replace(/,/g, '').trim(), 10) || 0,
      china: parseInt(cells.eq(2).text().replace(/,/g, '').trim(), 10) || 0,
      southeastAsia: parseInt(cells.eq(3).text().replace(/,/g, '').trim(), 10) || 0,
      northAmerica: parseInt(cells.eq(4).text().replace(/,/g, '').trim(), 10) || 0,
      europe: parseInt(cells.eq(5).text().replace(/,/g, '').trim(), 10) || 0,
      oceania: parseInt(cells.eq(6).text().replace(/,/g, '').trim(), 10) || 0,
      other: parseInt(cells.eq(7).text().replace(/,/g, '').trim(), 10) || 0,
    });
  }

  // Deduplicate by hour
  const seen = new Set<number>();
  return routes.filter((r) => {
    if (seen.has(r.hour)) return false;
    seen.add(r.hour);
    return true;
  }).sort((a, b) => a.hour - b.hour);
}

export async function scrapeForecast(terminal: Terminal, date?: string): Promise<CongestionForecast> {
  const targetDate = date || getTodayDate();
  logger.info(`Scraping forecast for ${terminal}, date: ${targetDate}`);

  const [inOutResult, routeData] = await Promise.allSettled([
    fetchInOutExcel(terminal, targetDate),
    fetchRouteHtml(terminal, targetDate),
  ]);

  const inOut = inOutResult.status === 'fulfilled' ? inOutResult.value : { departure: [], arrival: [] };
  const routes = routeData.status === 'fulfilled' ? routeData.value : [];

  if (inOutResult.status === 'rejected') {
    logger.error('Failed to fetch InOut data', inOutResult.reason);
  }
  if (routeData.status === 'rejected') {
    logger.error('Failed to fetch Route data', routeData.reason);
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

  const peakDep = inOutData.reduce((max, d) => d.departure.total > max.departure.total ? d : max, inOutData[0]);
  const peakArr = inOutData.reduce((max, d) => d.arrival.total > max.arrival.total ? d : max, inOutData[0]);

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
