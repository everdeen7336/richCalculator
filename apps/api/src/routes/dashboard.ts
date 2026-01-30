import { Router } from 'express';
import { DashboardApiResponse, DashboardData } from '@incheon-dashboard/shared';
import { validateTerminal } from '../middleware/validate-terminal';
import { asyncHandler } from '../middleware/error-handler';
import { parkingService } from '../services/parking.service';
import { congestionService } from '../services/congestion.service';

const router = Router();

/**
 * GET /api/v1/dashboard/:terminal
 * 통합 대시보드 데이터 조회
 */
router.get(
  '/:terminal',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const refresh = req.query.refresh === 'true';
    const terminal = req.terminal!;

    const [parkingResponse, congestionResponse] = await Promise.all([
      parkingService.getParkingInfo(terminal, refresh),
      congestionService.getCongestion(terminal, refresh),
    ]);

    // 둘 다 성공한 경우
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

      res.json(response);
      return;
    }

    // 부분 실패 또는 전체 실패
    const errors: string[] = [];
    if (!parkingResponse.success) {
      errors.push(`Parking: ${parkingResponse.error?.message}`);
    }
    if (!congestionResponse.success) {
      errors.push(`Congestion: ${congestionResponse.error?.message}`);
    }

    // 가능한 데이터라도 반환
    const partialData: Partial<DashboardData> = {};
    if (parkingResponse.data) partialData.parking = parkingResponse.data;
    if (congestionResponse.data) partialData.congestion = congestionResponse.data;

    const response: DashboardApiResponse = {
      success: false,
      data: Object.keys(partialData).length > 0 ? (partialData as DashboardData) : null,
      error: {
        code: 'PARTIAL_ERROR',
        message: errors.join('; '),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);
  })
);

export default router;
