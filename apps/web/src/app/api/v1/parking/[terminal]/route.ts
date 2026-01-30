import { NextRequest, NextResponse } from 'next/server';
import { validateTerminal } from '../../../_lib/validate-terminal';
import { Terminal } from '@incheon-dashboard/shared';
import { parkingService } from '@incheon-dashboard/api/src/services/parking.service';

export async function GET(req: NextRequest, { params }: { params: { terminal: string } }) {
  const result = validateTerminal(params.terminal);
  if (result instanceof NextResponse) return result;

  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';
  const response = await parkingService.getParkingInfo(result, refresh);
  return NextResponse.json(response);
}
