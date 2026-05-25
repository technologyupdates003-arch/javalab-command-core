import { Request, Response, NextFunction } from 'express';
import { get, set } from '@/services/cache.js';
import logger from '@/utils/logger.js';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator ? keyGenerator(req) : req.ip || 'unknown';
      const cacheKey = `rate_limit:${key}`;

      const current = (await get<number>(cacheKey)) || 0;

      if (current >= maxRequests) {
        logger.warn('Rate limit exceeded', { key, current, maxRequests });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
          },
          timestamp: new Date(),
        });
        return;
      }

      await set(cacheKey, current + 1, Math.ceil(windowMs / 1000));

      res.set('X-RateLimit-Limit', maxRequests.toString());
      res.set('X-RateLimit-Remaining', (maxRequests - current - 1).toString());
      res.set('X-RateLimit-Reset', new Date(Date.now() + windowMs).toISOString());

      next();
    } catch (err) {
      logger.error('Rate limiter error', err);
      // Continue without rate limiting if cache fails
      next();
    }
  };
}

// Default rate limiters
export const globalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyGenerator: (req) => req.ip || 'unknown',
});

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => `${req.ip}:${req.body?.email || 'unknown'}`,
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  keyGenerator: (req) => req.context?.userId || req.ip || 'unknown',
});
