import { Router, Request, Response } from 'express';
import { getGateway } from '@/services/gateway.js';
import { authMiddleware, requireRole } from '@/middleware/auth.js';
import logger from '@/utils/logger.js';
import { ApiResponse } from '@/types/index.js';

const router = Router();

/**
 * Get all registered services
 * GET /api/services
 */
router.get('/', authMiddleware, requireRole('admin'), (req: Request, res: Response): void => {
  try {
    const gateway = getGateway();
    const services = gateway.getServices();

    const serviceList = Object.values(services).map((service) => ({
      name: service.name,
      baseUrl: service.baseUrl,
      routes: service.routes,
      healthCheck: service.healthCheck,
    }));

    const response: ApiResponse<typeof serviceList> = {
      success: true,
      data: serviceList,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching services', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
      timestamp: new Date(),
    });
  }
});

/**
 * Get service details
 * GET /api/services/:serviceName
 */
router.get(
  '/:serviceName',
  authMiddleware,
  requireRole('admin'),
  (req: Request, res: Response): void => {
    try {
      const { serviceName } = req.params;
      const gateway = getGateway();
      const service = gateway.getServiceConfig(serviceName);

      if (!service) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Service ${serviceName} not found`,
          },
          timestamp: new Date(),
        });
        return;
      }

      const response: ApiResponse<typeof service> = {
        success: true,
        data: service,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching service', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
);

/**
 * Check service health
 * GET /api/services/:serviceName/health
 */
router.get(
  '/:serviceName/health',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { serviceName } = req.params;
      const gateway = getGateway();
      const service = gateway.getServiceConfig(serviceName);

      if (!service) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Service ${serviceName} not found`,
          },
          timestamp: new Date(),
        });
        return;
      }

      const client = gateway.getClient(serviceName);
      if (!client) {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: `Service ${serviceName} is not available`,
          },
          timestamp: new Date(),
        });
        return;
      }

      try {
        const response = await client.get(service.healthCheck, { timeout: 5000 });

        res.json({
          success: true,
          data: {
            service: serviceName,
            status: 'healthy',
            details: response.data,
          },
          timestamp: new Date(),
        });
      } catch (err) {
        logger.warn(`Health check failed for service ${serviceName}`, err);
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNHEALTHY',
            message: `Service ${serviceName} is unhealthy`,
          },
          timestamp: new Date(),
        });
      }
    } catch (err) {
      logger.error('Error checking service health', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date(),
      });
    }
  }
);

export default router;
