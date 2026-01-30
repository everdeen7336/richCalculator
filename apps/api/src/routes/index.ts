import { Router } from 'express';
import parkingRouter from './parking';
import congestionRouter from './congestion';
import forecastRouter from './forecast';
import dashboardRouter from './dashboard';

export const router = Router();

// 헬스체크
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API v1
router.use('/v1/parking', parkingRouter);
router.use('/v1/congestion', congestionRouter);
router.use('/v1/forecast', forecastRouter);
router.use('/v1/dashboard', dashboardRouter);
