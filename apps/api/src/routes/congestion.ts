import { Router } from 'express';
import { validateTerminal } from '../middleware/validate-terminal';
import { asyncHandler } from '../middleware/error-handler';
import { congestionService } from '../services/congestion.service';

const router = Router();

/**
 * GET /api/v1/congestion/:terminal
 * 터미널별 혼잡도 조회
 */
router.get(
  '/:terminal',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const refresh = req.query.refresh === 'true';
    const response = await congestionService.getCongestion(req.terminal!, refresh);
    res.json(response);
  })
);

/**
 * GET /api/v1/congestion/:terminal/gates
 * 게이트별 대기시간만 조회
 */
router.get(
  '/:terminal/gates',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const response = await congestionService.getCongestion(req.terminal!);

    if (response.success && response.data) {
      res.json({
        ...response,
        data: response.data.gates,
      });
    } else {
      res.json(response);
    }
  })
);

/**
 * GET /api/v1/congestion/:terminal/forecast
 * 시간대별 예측만 조회
 */
router.get(
  '/:terminal/forecast',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const response = await congestionService.getCongestion(req.terminal!);

    if (response.success && response.data) {
      res.json({
        ...response,
        data: response.data.hourlyForecast,
      });
    } else {
      res.json(response);
    }
  })
);

export default router;
