import { Request, Response, NextFunction } from 'express';
import { ERROR_CODES, ApiError } from '@incheon-dashboard/shared';
import { ScraperError } from '../scrapers/base.scraper';
import { logger } from '../utils/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, ERROR_CODES.VALIDATION_ERROR);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message, ERROR_CODES.NOT_FOUND);
  }
}

interface ErrorResponse {
  success: false;
  data: null;
  error: ApiError;
  timestamp: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  let statusCode = 500;
  let code = ERROR_CODES.INTERNAL_ERROR;
  let message = 'An unexpected error occurred';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err instanceof ScraperError) {
    statusCode = 503;
    code = ERROR_CODES.SCRAPER_ERROR;
    message = `Data source temporarily unavailable: ${err.source}`;
  }

  const response: ErrorResponse = {
    success: false,
    data: null,
    error: {
      code,
      message: process.env.NODE_ENV === 'production' && statusCode === 500 ? 'Internal server error' : message,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
