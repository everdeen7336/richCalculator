import { BaseScraper } from './base.scraper';
import { ParkingParser } from './parsers/parking.parser';
import {
  Terminal,
  ParkingType,
  ParkingStatus,
  ParkingInfo,
  ShortTermParking,
  LongTermParking,
  PARKING_URLS,
  isPeakHours,
} from '@incheon-dashboard/shared';

export class ParkingScraper extends BaseScraper<ParkingInfo> {
  private terminal: Terminal;
  private parser: ParkingParser;

  constructor(terminal: Terminal) {
    super();
    this.terminal = terminal;
    this.parser = new ParkingParser();
  }

  async scrape(): Promise<ParkingInfo> {
    this.logger.info(`Scraping parking data for ${this.terminal}`);

    const [shortTerm, longTerm] = await Promise.all([
      this.scrapeShortTerm(),
      this.scrapeLongTerm(),
    ]);

    return {
      terminal: this.terminal,
      shortTerm,
      longTerm,
      timestamp: new Date().toISOString(),
      peakHoursWarning: isPeakHours(),
    };
  }

  private async scrapeShortTerm(): Promise<ShortTermParking> {
    const url = PARKING_URLS[this.terminal][ParkingType.SHORT_TERM];
    this.logger.debug(`Scraping short-term parking: ${url}`);

    try {
      const $ = await this.fetchPage(url!);
      const floors = this.parser.parseShortTermFloors($, this.terminal);
      const lastUpdated = this.parser.parseLastUpdated($);

      const totalAvailable = floors.reduce((sum, f) => sum + (f.availableSpaces ?? 0), 0);
      const hasFull = floors.some((f) => f.status === ParkingStatus.FULL);

      this.logger.info(
        `Short-term parking ${this.terminal}: ${floors.length} floors, ${totalAvailable} available`
      );

      return {
        terminal: this.terminal,
        type: ParkingType.SHORT_TERM,
        floors,
        totalAvailable,
        hasFull,
        lastUpdated,
      };
    } catch (error) {
      this.logger.error('Failed to scrape short-term parking', error);
      return this.getDefaultShortTerm();
    }
  }

  private async scrapeLongTerm(): Promise<LongTermParking> {
    const url = PARKING_URLS[this.terminal][ParkingType.LONG_TERM];

    // T2는 장기주차장 실시간 현황 페이지가 없음
    if (!url) {
      this.logger.info(`Long-term parking ${this.terminal}: No real-time data available`);
      return {
        terminal: this.terminal,
        type: ParkingType.LONG_TERM,
        floors: undefined,
        towers: undefined,
        totalAvailable: 0,
        hasFull: false,
        lastUpdated: new Date().toISOString(),
        unavailable: true, // 정보 미제공 표시
      } as LongTermParking;
    }

    this.logger.debug(`Scraping long-term parking: ${url}`);

    try {
      const $ = await this.fetchPage(url);
      const lastUpdated = this.parser.parseLastUpdated($);

      // T1은 타워 방식
      const towers = this.parser.parseLongTermTowers($, this.terminal);
      const totalAvailable = towers.reduce((sum, t) => sum + (t.availableSpaces ?? 0), 0);
      const hasFull = towers.some((t) => t.status === ParkingStatus.FULL);

      this.logger.info(
        `Long-term parking ${this.terminal}: ${towers.length} towers, ${totalAvailable} available`
      );

      return {
        terminal: this.terminal,
        type: ParkingType.LONG_TERM,
        towers,
        totalAvailable,
        hasFull,
        lastUpdated,
      };
    } catch (error) {
      this.logger.error('Failed to scrape long-term parking', error);
      return this.getDefaultLongTerm();
    }
  }

  private getDefaultShortTerm(): ShortTermParking {
    return {
      terminal: this.terminal,
      type: ParkingType.SHORT_TERM,
      floors: [],
      totalAvailable: 0,
      hasFull: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  private getDefaultLongTerm(): LongTermParking {
    return {
      terminal: this.terminal,
      type: ParkingType.LONG_TERM,
      towers: this.terminal === Terminal.T1 ? [] : undefined,
      floors: this.terminal === Terminal.T2 ? [] : undefined,
      totalAvailable: 0,
      hasFull: false,
      lastUpdated: new Date().toISOString(),
    };
  }
}
