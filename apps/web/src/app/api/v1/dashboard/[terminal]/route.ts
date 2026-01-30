import { NextRequest, NextResponse } from 'next/server';
import { validateTerminal } from '../../../_lib/validate-terminal';
import { DashboardData, DashboardApiResponse } from '@incheon-dashboard/shared';
import { parkingService } from '@incheon-dashboard/api/src/services/parking.service';
import { congestionService } from '@incheon-dashboard/api/src/services/congestion.service';

export async function GET(req: NextRequest, { params }: { params: { terminal: string } }) {
  const result = validateTerminal(params.terminal);
  if (result instanceof NextResponse) return result;

  const refresh = req.nextUrl.searchParams.get('refresh') === 'true';

  const [parkingResponse, congestionResponse] = await Promise.all([
    parkingService.getParkingInfo(result, refresh),
    congestionService.getCongestion(result, refresh),
  ]);

  if (parkingResponse.success && congestionResponse.success && parkingResponse.data && congestionResponse.data) {
    const data: DashboardData = {
      congestion: congestionResponse.data,
      parking: parkingResponse.data,
    };
    const response: DashboardApiResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response);
  }

  const errors: string[] = [];
  if (!parkingResponse.success) errors.push(`Parking: ${parkingResponse.error?.message}`);
  if (!congestionResponse.success) errors.push(`Congestion: ${congestionResponse.error?.message}`);

  const partialData: Partial<DashboardData> = {};
  if (parkingResponse.data) partialData.parking = parkingResponse.data;
  if (congestionResponse.data) partialData.congestion = congestionResponse.data;

  const response: DashboardApiResponse = {
    success: false,
    data: Object.keys(partialData).length > 0 ? (partialData as DashboardData) : null,
    error: { code: 'PARTIAL_ERROR', message: errors.join('; ') },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(response);
}
