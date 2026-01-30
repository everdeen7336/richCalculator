import { NextRequest, NextResponse } from 'next/server';
import { validateTerminal } from '../../../../_lib/validate-terminal';
import { congestionService } from '@incheon-dashboard/api/src/services/congestion.service';

export async function GET(req: NextRequest, { params }: { params: { terminal: string } }) {
  const result = validateTerminal(params.terminal);
  if (result instanceof NextResponse) return result;

  const response = await congestionService.getCongestion(result);
  if (response.success && response.data) {
    return NextResponse.json({ ...response, data: response.data.gates });
  }
  return NextResponse.json(response);
}
