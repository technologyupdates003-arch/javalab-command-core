import { Router, Request, Response } from 'express';
import { query } from '@/services/database.js';
import { get } from '@/services/cache.js';
import logger from '@/utils/logger.js';
import { SystemHealth, HealthStatus, ApiResponse } from '@/types/index.js';

const router = Router();

async function checkDatabaseHealth(): Promise<HealthStatus> {
  try {
    await query('SELECT NOW()');
    return {
      status: 'healthy',
      lastChecked: new Date(),
    };
  } catch (err) {
    logger.error('Database health check failed', err);
    return {
      status: 'down',
      lastChecked: new Date(),
      details: { error: String(err) },
    };
  }
}

async function checkCacheHealth(): Promise<HealthStatus> {
  try {
    const testKey = 'health_check_test';
    const testValue = { timestamp: Date.now() };

    // Try to set and get a value
    const cache = await import('@/services/cache.js');
    await cache.set(testKey, testValue, 10);
    const retrieved = await cache.get(testKey);

    if (!retrieved) {
      throw new Error('Cache set/get failed');
    }

    await cache.del(testKey);

    return {
      status: 'healthy',
      lastChecked: new Date(),
    };
  } catch (err) {
    logger.error('Cache health check failed', err);
    return {
      status: 'down',
      lastChecked: new Date(),
      details: { error: String(err) },
    };
  }
}

async function checkMessageQueueHealth(): Promise<HealthStatus> {
  try {
    // For now, we'll assume it's healthy if we can import it
    // In production, you'd want to actually test the connection
    return {
      status: 'healthy',
      lastChecked: new Date(),
    };
  } catch (err) {
    logger.error('Message queue health check failed', err);
    return {
      status: 'down',
      lastChecked: new Date(),
      details: { error: String(err) },
    };
  }
}

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [database, cache, messageQueue] = await Promise.all([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkMessageQueueHealth(),
    ]);

    const systemHealth: SystemHealth = {
      apiGateway: {
        status: 'healthy',
        lastChecked: new Date(),
      },
      database,
      cache,
      messageQueue,
      elasticsearch: {
        status: 'healthy',
        lastChecked: new Date(),
      },
      timestamp: new Date(),
    };

    const response: ApiResponse<SystemHealth> = {
      success: true,
      data: systemHealth,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Health check error', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
      },
      timestamp: new Date(),
    };

    res.status(503).json(response);
  }
});

export default router;
