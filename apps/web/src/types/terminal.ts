/**
 * 터미널 식별자
 */
export enum Terminal {
  T1 = 'T1',
  T2 = 'T2',
}

/**
 * 터미널 메타데이터
 */
export interface TerminalInfo {
  id: Terminal;
  name: string;
  nameKo: string;
}

/**
 * 터미널 설정 상수
 */
export const TERMINAL_CONFIG: Record<Terminal, TerminalInfo> = {
  [Terminal.T1]: {
    id: Terminal.T1,
    name: 'Terminal 1',
    nameKo: '제1여객터미널',
  },
  [Terminal.T2]: {
    id: Terminal.T2,
    name: 'Terminal 2',
    nameKo: '제2여객터미널',
  },
};

/**
 * 터미널 유효성 검사
 */
export function isValidTerminal(value: string): value is Terminal {
  return Object.values(Terminal).includes(value as Terminal);
}
