import { Router, Request, Response } from 'express';
import { authMiddleware, requirePermission } from '@/middleware/auth.js';
import { requireModuleAccess } from '@/middleware/rbac.js';
import logger from '@/utils/logger.js';
import {
  getKPIs,
  getKPIById,
  updateKPI,
  getChartData,
  getDashboardMetrics,
  invalidateKPICache,
  invalidateChartCache,
} from '@/services/dashboard.js';
import { broadcastToAll } from '@/services/websocket.js';
import { ApiResponse } from '@/types/index.js';

const router = Router();

// Middleware
router.use(authMiddleware);
router.use(requireModuleAccess('dashboard'));

/**
 * GET /api/dashboard/kpis
 * Fetch all KPIs
 * Requirements: 1.1
 */
router.get('/kpis', async (_req: Request, res: Response): Promise<void> => {
  try {
    const kpis = await getKPIs();

    const response: ApiResponse<any> = {
      success: true,
      data: {
        kpis,
        count: kpis.length,
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching KPIs', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'KPI_FETCH_FAILED',
        message: 'Failed to fetch KPIs',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/dashboard/kpis/:kpiId
 * Fetch specific KPI
 * Requirements: 1.1
 */
router.get('/kpis/:kpiId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { kpiId } = req.params;

    const kpi = await getKPIById(kpiId);

    if (!kpi) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'KPI_NOT_FOUND',
          message: `KPI ${kpiId} not found`,
        },
        timestamp: new Date(),
      };

      res.status(404).json(response);
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: kpi,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching KPI', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'KPI_FETCH_FAILED',
        message: 'Failed to fetch KPI',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
});

/**
 * PUT /api/dashboard/kpis/:kpiId
 * Update KPI value
 * Requirements: 1.2
 */
router.put(
  '/kpis/:kpiId',
  requirePermission('dashboard:write'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { kpiId } = req.params;
      const { value } = req.body;
      const userId = (req as any).user?.userId;

      if (value === undefined || value === null) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'KPI value is required',
          },
          timestamp: new Date(),
        };

        res.status(400).json(response);
        return;
      }

      const kpi = await updateKPI(kpiId, value, userId);

      // Broadcast KPI update via WebSocket (within 500ms requirement)
      broadcastToAll('kpi:updated', {
        kpi,
        timestamp: new Date(),
      });

      const response: ApiResponse<any> = {
        success: true,
        data: kpi,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error updating KPI', err);

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'KPI_UPDATE_FAILED',
          message: 'Failed to update KPI',
        },
        timestamp: new Date(),
      };

      res.status(500).json(response);
    }
  }
);

/**
 * GET /api/dashboard/health
 * Get system health status
 * Requirements: 1.3
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  try {
    const { SystemHealth } = await import('@/types/index.js');
    const healthRoutes = await import('@/routes/health.js');

    // Get health from health route
    const healthResponse = await fetch('http://localhost:3000/api/health');
    const healthData = await healthResponse.json();

    const response: ApiResponse<any> = {
      success: true,
      data: healthData.data,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching system health', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Failed to fetch system health',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/dashboard/charts/:chartType
 * Get chart data for visualization
 * Requirements: 1.4
 */
router.get('/charts/:chartType', async (req: Request, res: Response): Promise<void> => {
  try {
    const { chartType } = req.params;

    const validChartTypes = ['revenue', 'clients', 'projects', 'staff', 'subscriptions'];

    if (!validChartTypes.includes(chartType)) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INVALID_CHART_TYPE',
          message: `Invalid chart type. Valid types: ${validChartTypes.join(', ')}`,
        },
        timestamp: new Date(),
      };

      res.status(400).json(response);
      return;
    }

    const chartData = await getChartData(chartType);

    const response: ApiResponse<any> = {
      success: true,
      data: {
        type: chartType,
        ...chartData,
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching chart data', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'CHART_FETCH_FAILED',
        message: 'Failed to fetch chart data',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
});

/**
 * GET /api/dashboard/metrics
 * Get complete dashboard metrics (KPIs + charts)
 * Requirements: 1.1, 1.3, 1.4
 */
router.get('/metrics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await getDashboardMetrics();

    const response: ApiResponse<any> = {
      success: true,
      data: metrics,
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching dashboard metrics', err);

    const response: ApiResponse<null> = {
      success: false,
      error: {
        code: 'METRICS_FETCH_FAILED',
        message: 'Failed to fetch dashboard metrics',
      },
      timestamp: new Date(),
    };

    res.status(500).json(response);
  }
});

/**
 * POST /api/dashboard/cache/invalidate
 * Invalidate dashboard cache (admin only)
 * Requirements: 1.1, 1.4
 */
router.post(
  '/cache/invalidate',
  requirePermission('dashboard:admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { type, id } = req.body;

      if (type === 'kpi') {
        await invalidateKPICache(id);
      } else if (type === 'chart') {
        await invalidateChartCache(id);
      } else if (type === 'all') {
        await invalidateKPICache();
        await invalidateChartCache();
      } else {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_CACHE_TYPE',
            message: 'Invalid cache type. Valid types: kpi, chart, all',
          },
          timestamp: new Date(),
        };

        res.status(400).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: 'Cache invalidated successfully',
          type,
          id,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error invalidating cache', err);

      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'CACHE_INVALIDATION_FAILED',
          message: 'Failed to invalidate cache',
        },
        timestamp: new Date(),
      };

      res.status(500).json(response);
    }
  }
);

export default router;
