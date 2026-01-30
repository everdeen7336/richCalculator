import { BaseScraper } from './base.scraper';
import {
  Terminal,
  CongestionLevel,
  GateInfo,
  HourlyCongestion,
  TerminalCongestion,
  CONGESTION_URLS,
  waitTimeToLevel,
  colorClassToLevel,
  TERMINAL_CONFIG,
} from '@incheon-dashboard/shared';

interface PassengerNoticeResponse {
  [key: string]: string | number | undefined;
}

export class CongestionScraper extends BaseScraper<TerminalCongestion> {
  private terminal: Terminal;

  constructor(terminal: Terminal) {
    super();
    this.terminal = terminal;
  }

  async scrape(): Promise<TerminalCongestion> {
    this.logger.info(`Scraping congestion data for ${this.terminal}`);

    const [gateData, hourlyForecast] = await Promise.all([
      this.fetchGateData(),
      this.fetchHourlyForecast(),
    ]);

    const gates = this.parseGateData(gateData);
    const overallLevel = this.calculateOverallLevel(gates);

    this.logger.info(`Congestion ${this.terminal}: ${gates.length} gates, overall: ${overallLevel}`);

    return {
      terminal: this.terminal,
      timestamp: new Date().toISOString(),
      gates,
      hourlyForecast,
      overallLevel,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async fetchGateData(): Promise<PassengerNoticeResponse> {
    try {
      // 혼잡도 API 호출
      const response = await this.fetchApi<PassengerNoticeResponse>(CONGESTION_URLS.API);
      return response;
    } catch (error) {
      this.logger.warn('Failed to fetch gate data from API, trying page scrape', error);
      return this.scrapeGateDataFromPage();
    }
  }

  private async scrapeGateDataFromPage(): Promise<PassengerNoticeResponse> {
    try {
      const $ = await this.fetchPage(CONGESTION_URLS.PAGE);
      const data: PassengerNoticeResponse = {};

      // 테이블에서 게이트 대기시간 추출
      $('#userEx tbody tr, .gate-info tr').each((_, row) => {
        const $row = $(row);
        const gateId = $row.find('td:first-child').text().trim();
        const waitTime = $row.find('td:last-child').text().trim();

        if (gateId && waitTime) {
          const minutes = parseInt(waitTime.replace(/[^0-9]/g, ''), 10);
          if (!isNaN(minutes)) {
            data[gateId] = minutes;
          }
        }
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to scrape gate data from page', error);
      return {};
    }
  }

  private async fetchHourlyForecast(): Promise<HourlyCongestion[]> {
    try {
      const $ = await this.fetchPage(CONGESTION_URLS.PAGE);
      const forecast: HourlyCongestion[] = [];

      // 시간대별 테이블 파싱
      $('table tbody tr').each((_, row) => {
        const $row = $(row);
        const timeSlot = $row.find('td:first-child, th:first-child').text().trim();

        // 시간대 패턴 확인 (예: "09:00~10:00" 또는 "09~10시")
        const hourMatch = timeSlot.match(/(\d{1,2})/);
        if (hourMatch) {
          const hour = parseInt(hourMatch[1], 10);

          if (hour >= 0 && hour <= 23) {
            const countText = $row.find('td:nth-child(2)').text().replace(/,/g, '').trim();
            const count = parseInt(countText, 10) || 0;
            const colorClass = $row.attr('class') || '';

            forecast.push({
              hour,
              timeSlot: `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`,
              predictedCount: count,
              congestionLevel: colorClassToLevel(colorClass),
            });
          }
        }
      });

      // 중복 제거 및 정렬
      const uniqueForecast = forecast.filter(
        (item, index, self) => index === self.findIndex((t) => t.hour === item.hour)
      );

      return uniqueForecast.sort((a, b) => a.hour - b.hour);
    } catch (error) {
      this.logger.warn('Failed to fetch hourly forecast', error);
      return this.getDefaultHourlyForecast();
    }
  }

  private parseGateData(data: PassengerNoticeResponse): GateInfo[] {
    const gates: GateInfo[] = [];
    const gateIds = this.terminal === Terminal.T1 ? ['DG2', 'DG3', 'DG4', 'DG5'] : ['DG1', 'DG2'];

    for (const gateId of gateIds) {
      // 여러 키 패턴 시도
      const possibleKeys = [`${gateId}_E`, `${gateId}`, gateId.toLowerCase()];
      let waitTime: number | null = null;

      for (const key of possibleKeys) {
        const value = data[key];
        if (value !== undefined) {
          waitTime = typeof value === 'number' ? value : parseInt(String(value), 10);
          if (isNaN(waitTime)) waitTime = null;
          break;
        }
      }

      gates.push({
        gateId,
        gateName: `출국장 ${gateId.replace('DG', '')}`,
        waitTimeMinutes: waitTime,
        congestionLevel: waitTimeToLevel(waitTime),
      });
    }

    return gates;
  }

  private calculateOverallLevel(gates: GateInfo[]): CongestionLevel {
    if (gates.length === 0) return CongestionLevel.NORMAL;

    const levelOrder: Record<CongestionLevel, number> = {
      [CongestionLevel.SMOOTH]: 1,
      [CongestionLevel.NORMAL]: 2,
      [CongestionLevel.CONGESTED]: 3,
      [CongestionLevel.VERY_CONGESTED]: 4,
    };

    const maxOrder = Math.max(...gates.map((g) => levelOrder[g.congestionLevel]));
    const entries = Object.entries(levelOrder) as [CongestionLevel, number][];
    return entries.find(([_, order]) => order === maxOrder)?.[0] || CongestionLevel.NORMAL;
  }

  private getDefaultHourlyForecast(): HourlyCongestion[] {
    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      timeSlot: `${hour.toString().padStart(2, '0')}:00-${((hour + 1) % 24).toString().padStart(2, '0')}:00`,
      predictedCount: 0,
      congestionLevel: CongestionLevel.NORMAL,
    }));
  }
}
