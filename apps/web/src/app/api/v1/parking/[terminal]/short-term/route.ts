import { NextRequest, NextResponse } from 'next/server';
import { validateTerminal } from '../../../../_lib/validate-terminal';
import { parkingService } from '@incheon-dashboard/api/src/services/parking.service';

export async function GET(req: NextRequest, { params }: { params: { terminal: string } }) {
  const result = validateTerminal(params.terminal);
  if (result instanceof NextResponse) return result;

  const response = await parkingService.getParkingInfo(result);
  if (response.success && response.data) {
    return NextResponse.json({ ...response, data: response.data.shortTerm });
  }
  return NextResponse.json(response);
}
