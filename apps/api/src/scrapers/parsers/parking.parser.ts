import * as cheerio from 'cheerio';
import {
  Terminal,
  ParkingStatus,
  ParkingFloor,
  ParkingTower,
  parseAvailabilityText,
} from '@incheon-dashboard/shared';
import { Logger } from '../../utils/logger';

export class ParkingParser {
  private logger = new Logger('ParkingParser');

  /**
   * 단기주차장 층별 정보 파싱
   */
  parseShortTermFloors($: cheerio.CheerioAPI, terminal: Terminal): ParkingFloor[] {
    const floors: ParkingFloor[] = [];
    const bodyText = $('body').text();

    // 정규표현식으로 층별 정보 추출
    // 패턴: "지하 1층 179대 가능" 또는 "지상 1층 만차"
    // parseLongTermTowers처럼 구체적인 패턴을 우선순위로 배치하고 매칭 로직 반영
    const floorPatterns = [
      // 구체적인 패턴 우선: 지하, 지상 (가장 명확)
      { id: 'B', name: '지하', regex: /지하\s*(\d+)층[^\d]*?(만차|\d+대\s*가능)/gi, prefix: 'B' },
      { id: 'GROUND', name: '지상', regex: /지상\s*(\d+)층[^\d]*?(만차|\d+대\s*가능)/gi, prefix: '' },
      // M 층 (구체적인 패턴, 지상/지하와 구분되도록)
      { id: 'M', name: 'M 층', regex: /M\s*층[^\d]*?(만차|\d+대\s*가능)/gi, prefix: 'M', floorNum: '1' },
      { id: 'M_NUM', name: 'M', regex: /M(\d+)[층]?[^\d]*?(만차|\d+대\s*가능)/gi, prefix: 'M' },
      // B, F 패턴
      { id: 'B_SHORT', name: 'B', regex: /B(\d+)[층]?[^\d]*?(만차|\d+대\s*가능)/gi, prefix: 'B' },
      { id: 'F', name: 'F', regex: /(\d+)F[층]?[^\d]*?(만차|\d+대\s*가능)/gi, prefix: '' },
    ];

    for (const pattern of floorPatterns) {
      const { regex, prefix, floorNum: fixedFloorNum } = pattern;
      // parseLongTermTowers처럼 전역 플래그로 모든 매칭 찾기
      let match;
      while ((match = regex.exec(bodyText)) !== null) {
        const floorNum = fixedFloorNum || match[1];
        const statusText = fixedFloorNum ? match[1] : match[2];
        const { status, spaces } = parseAvailabilityText(statusText);

        const floorId = prefix ? `${prefix}${floorNum}` : `${floorNum}F`;
        const floorName = prefix === 'B' ? `지하 ${floorNum}층` : prefix === 'M' ? `M 층` : `지상 ${floorNum}층`;

        // 중복 체크 (parseLongTermTowers처럼)
        if (!floors.some((f) => f.floorId === floorId)) {
          floors.push({
            floorId,
            floorName,
            status,
            availableSpaces: spaces,
            rawText: statusText,
          });
        }
      }
    }

    // 결과가 없으면 대체 파싱 시도
    if (floors.length === 0) {
      this.logger.warn('No floors found with regex, trying alternative parsing');
      return this.parseFloorsAlternative($);
    }

    // 층 순서 정렬 (B2, B1, 1F, 2F...)
    return this.sortFloors(floors);
  }

  /**
   * 장기주차장 타워 정보 파싱
   */
  parseLongTermTowers($: cheerio.CheerioAPI, terminal: Terminal): ParkingTower[] {
    const towers: ParkingTower[] = [];
    const bodyText = $('body').text();

    // 터미널 정보로 직접 판단
    const isT1 = terminal === Terminal.T1;

    // 타워 패턴 정의 (우선순위 순서대로)
    const towerPatterns = [
      // 장기주차장 P1, P3, P4 (구체적인 이름 우선)
      { id: 'LONG_P1', name: '장기주차장 P1', regex: /장기주차장\s*P1[^\d]*?(만차|\d+대\s*가능)/i },
      { id: 'LONG_P2', name: '장기주차 P2', regex: /장기주차\s*P2[^\d]*?(만차|\d+대\s*가능)/i },
      { id: 'LONG_P3', name: '장기주차장 P3', regex: /장기주차장\s*P3[^\d]*?(만차|\d+대\s*가능)/i },
      { id: 'LONG_P4', name: '장기주차 P4', regex: /장기주차\s*P4[^\d]*?(만차|\d+대\s*가능)/i },
      // 주차타워 동편, 서편
      { id: 'TOWER_EAST', name: '주차타워 동편', regex: /주차타워\s*동편[^\d]*?(만차|\d+대\s*가능)/i },
      { id: 'TOWER_WEST', name: '주차타워 서편', regex: /주차타워\s*서편[^\d]*?(만차|\d+대\s*가능)/i },
      // P1 주차타워, P2 주차타워 (T1에서는 제외)
      { id: 'P1', name: 'P1 주차타워', regex: /P1\s*(?:주차)?(?:타워)?[^\d]*?(만차|\d+대\s*가능)/i },
      { id: 'P2', name: 'P2 주차타워', regex: /P2\s*(?:주차)?(?:타워)?[^\d]*?(만차|\d+대\s*가능)/i },
      // 장기주차장 (일반, 다른 패턴과 겹치지 않도록 마지막에)
      { id: 'LONG', name: '장기주차장', regex: /장기주차장(?:\s+(?!P[134]))[^\d]*?(만차|\d+대\s*가능)/i },
    ];

    for (const { id, name, regex } of towerPatterns) {
      // T1에서는 P1, P2 주차타워 제외
      if (isT1 && (id === 'P1' || id === 'P2')) {
        continue;
      }

      const match = bodyText.match(regex);
      if (match) {
        const { status, spaces } = parseAvailabilityText(match[1]);
        // 중복 체크
        if (!towers.some((t) => t.towerId === id)) {
          towers.push({
            towerId: id,
            towerName: name,
            status,
            availableSpaces: spaces,
            rawText: match[1],
          });
        }
      }
    }

    return towers;
  }

  /**
   * 마지막 업데이트 시간 파싱
   */
  parseLastUpdated($: cheerio.CheerioAPI): string {
    const bodyText = $('body').text();

    // 패턴: "2026.01.25 21:24:22"
    const match = bodyText.match(/(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2})/);
    if (match) {
      try {
        const dateStr = match[1].replace(/\./g, '-').replace(' ', 'T');
        return new Date(dateStr).toISOString();
      } catch {
        this.logger.warn('Failed to parse date:', match[1]);
      }
    }

    return new Date().toISOString();
  }

  /**
   * 대체 파싱 로직 (HTML 구조 기반)
   */
  private parseFloorsAlternative($: cheerio.CheerioAPI): ParkingFloor[] {
    const floors: ParkingFloor[] = [];

    // 공항 사이트의 일반적인 주차 정보 구조 탐색
    $('div, p, span, td').each((_, elem) => {
      const text = $(elem).text().trim();

      // "지하 1층" 또는 "지상 1층" 패턴 찾기
      if (text.match(/^(지하|지상)\s*\d+층$/)) {
        const nextText = $(elem).next().text().trim();
        if (nextText.includes('만차') || nextText.includes('대 가능')) {
          const floorMatch = text.match(/(지하|지상)\s*(\d+)층/);
          if (floorMatch) {
            const prefix = floorMatch[1] === '지하' ? 'B' : '';
            const floorNum = floorMatch[2];
            const { status, spaces } = parseAvailabilityText(nextText);

            floors.push({
              floorId: prefix ? `${prefix}${floorNum}` : `${floorNum}F`,
              floorName: text,
              status,
              availableSpaces: spaces,
              rawText: nextText,
            });
          }
        }
      }
    });

    return this.sortFloors(floors);
  }

  /**
   * 층 정렬 (B2, B1, 1F, 2F, 3F...)
   */
  private sortFloors(floors: ParkingFloor[]): ParkingFloor[] {
    return floors.sort((a, b) => {
      const aOrder = this.getFloorOrder(a.floorId);
      const bOrder = this.getFloorOrder(b.floorId);
      return aOrder - bOrder;
    });
  }

  private getFloorOrder(floorId: string): number {
    if (floorId.startsWith('B')) {
      return -parseInt(floorId.slice(1), 10);
    }
    if (floorId.startsWith('M')) {
      return parseInt(floorId.slice(1), 10) || 0;
    }
    return parseInt(floorId.replace('F', ''), 10);
  }
}
