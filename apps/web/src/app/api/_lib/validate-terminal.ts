import { NextResponse } from 'next/server';
import { Terminal, isValidTerminal } from '@incheon-dashboard/shared';

export function validateTerminal(terminalParam: string): Terminal | NextResponse {
  const upper = terminalParam.toUpperCase();
  if (!isValidTerminal(upper)) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: `Invalid terminal: ${upper}. Must be T1 or T2` },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
  return upper as Terminal;
}
