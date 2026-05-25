import { Request, Response, NextFunction } from 'express';
import logger from '@/utils/logger.js';

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || `${Date.now()}-${Math.random()}`;

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  // Log request
  logger.info({
    msg: 'Incoming request',
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userId: req.context?.userId,
    ip: req.ip,
  });

  // Capture response
  const originalSend = res.send;

  res.send = function (data: unknown) {
    const duration = Date.now() - startTime;

    logger.info({
      msg: 'Request completed',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      userId: req.context?.userId,
    });

    return originalSend.call(this, data);
  };

  next();
}
