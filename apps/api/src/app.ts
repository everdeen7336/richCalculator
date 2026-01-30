import express from 'express';
import cors from 'cors';
import { router } from './routes';
import { errorHandler } from './middleware/error-handler';

export function createApp() {
  const app = express();

  // 미들웨어
  app.use(cors());
  app.use(express.json());

  // 라우트
  app.use('/api', router);

  // 에러 핸들러
  app.use(errorHandler);

  return app;
}
