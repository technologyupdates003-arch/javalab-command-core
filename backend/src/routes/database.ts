import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '@/middleware/auth.js';
import { requirePermission } from '@/middleware/rbac.js';
import { runMigrations, getMigrationStatus, seedInitialData } from '@/services/migrations.js';
import logger from '@/utils/logger.js';
import { ApiResponse } from '@/types/index.js';

const router = Router();

/**
 * Get migration status
 * GET /api/database/migrations/status
 */
router.get(
  '/migrations/status',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const status = await getMigrationStatus();

      const response: ApiResponse<any> = {
        success: true,
        data: {
          executed: status.executed.length,
          pending: status.pending.length,
          migrations: {
            executed: status.executed,
            pending: status.pending,
          },
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error getting migration status', err);
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
 * Run pending migrations
 * POST /api/database/migrations/run
 */
router.post(
  '/migrations/run',
  authMiddleware,
  requireRole('admin'),
  requirePermission('database:manage'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      logger.warn('Running database migrations', { userId: req.context?.userId });

      await runMigrations();

      const status = await getMigrationStatus();

      const response: ApiResponse<any> = {
        success: true,
        data: {
          message: 'Migrations completed successfully',
          executed: status.executed.length,
          pending: status.pending.length,
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error running migrations', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'MIGRATION_FAILED',
          message: 'Migration failed',
          details: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date(),
      });
    }
  }
);

/**
 * Seed initial data
 * POST /api/database/seed
 */
router.post(
  '/seed',
  authMiddleware,
  requireRole('admin'),
  requirePermission('database:manage'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      logger.warn('Seeding initial database data', { userId: req.context?.userId });

      await seedInitialData();

      const response: ApiResponse<null> = {
        success: true,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error seeding data', err);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEED_FAILED',
          message: 'Data seeding failed',
          details: err instanceof Error ? err.message : String(err),
        },
        timestamp: new Date(),
      });
    }
  }
);

/**
 * Get database info
 * GET /api/database/info
 */
router.get(
  '/info',
  authMiddleware,
  requireRole('admin'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const response: ApiResponse<any> = {
        success: true,
        data: {
          database: process.env.DB_NAME || 'javalab_hq',
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || '5432',
          user: process.env.DB_USER || 'postgres',
          status: 'connected',
        },
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error getting database info', err);
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
