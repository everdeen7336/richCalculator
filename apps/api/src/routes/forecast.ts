import { Router } from 'express';
import { validateTerminal } from '../middleware/validate-terminal';
import { asyncHandler } from '../middleware/error-handler';
import { forecastService } from '../services/forecast.service';

const router = Router();

/**
 * GET /api/v1/forecast/:terminal
 * 터미널별 혼잡도 예측 (출입국별 + 노선별)
 */
router.get(
  '/:terminal',
  validateTerminal,
  asyncHandler(async (req, res) => {
    const date = (req.query.date as string) || getTodayDate();
    const refresh = req.query.refresh === 'true';
    const response = await forecastService.getForecast(req.terminal!, date, refresh);
    res.json(response);
  })
);

function getTodayDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export default router;
