import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger.js';
import { AppError, ApiResponse } from '@/types/index.js';

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      code: err.code,
      statusCode: err.statusCode,
      message: err.message,
    });

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
      timestamp: new Date(),
    };

    res.status(err.statusCode).json(response);
  } else {
    logger.error('Unexpected error', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
    },
    timestamp: new Date(),
  };

  res.status(404).json(response);
}
