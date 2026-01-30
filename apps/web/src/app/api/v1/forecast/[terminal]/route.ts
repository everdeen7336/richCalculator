import { NextRequest, NextResponse } from 'next/server';
import { validateTerminal } from '../../../_lib/validate-terminal';
import { forecastService } from '@incheon-dashboard/api/src/services/forecast.service';

export async function GET(req: NextRequest, { params }: { params: { terminal: string } }) {
  const result = validateTerminal(params.terminal);
  if (result instanceof NextResponse) return result;

  const date = req.nextUrl.searchParams.get('date') || undefined;
  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
  const response = await forecastService.getForecast(result, date || getTodayDate(), refresh);
  return NextResponse.json(response);
}

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
