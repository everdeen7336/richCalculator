import { Router } from 'express';
import { validateTerminal } from '../middleware/validate-terminal';
import { asyncHandler } from '../middleware/error-handler';
import { parkingService } from '../services/parking.service';

const router = Router();

/**
 * GET /api/v1/parking/:terminal
 * 터미널별 주차장 현황 조회
 */
router.get(
  '/:terminal',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const refresh = req.query.refresh === 'true';
    const response = await parkingService.getParkingInfo(req.terminal!, refresh);
    res.json(response);
  })
);

/**
 * GET /api/v1/parking/:terminal/short-term
 * 단기주차장 현황만 조회
 */
router.get(
  '/:terminal/short-term',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const response = await parkingService.getParkingInfo(req.terminal!);

    if (response.success && response.data) {
      res.json({
        ...response,
        data: response.data.shortTerm,
      });
    } else {
      res.json(response);
    }
  })
);

/**
 * GET /api/v1/parking/:terminal/long-term
 * 장기주차장 현황만 조회
 */
router.get(
  '/:terminal/long-term',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const response = await parkingService.getParkingInfo(req.terminal!);

    if (response.success && response.data) {
      res.json({
        ...response,
        data: response.data.longTerm,
      });
    } else {
      res.json(response);
    }
  })
);

export default router;
