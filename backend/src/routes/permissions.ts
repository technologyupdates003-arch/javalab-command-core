import { Router, Request, Response } from 'express';
import { query } from '@/services/database.js';
import { authMiddleware, requireRole } from '@/middleware/auth.js';
import { requirePermission } from '@/middleware/rbac.js';
import logger from '@/utils/logger.js';
import { AppError, ApiResponse, PaginatedResponse } from '@/types/index.js';

const router = Router();

/**
 * Get all permissions
 * GET /api/permissions
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10, module } = req.query;
    const offset = ((Number(page) - 1) * Number(pageSize)) as number;

    let countQuery = 'SELECT COUNT(*) as count FROM permissions';
    let dataQuery = `SELECT id, name, description, module, action, created_at, updated_at
                     FROM permissions`;
    const params: unknown[] = [];

    if (module) {
      countQuery += ' WHERE module = $1';
      dataQuery += ' WHERE module = $1';
      params.push(module);
      params.push(pageSize);
      params.push(offset);
    } else {
      params.push(pageSize);
      params.push(offset);
    }

    dataQuery += ' ORDER BY module, action ASC LIMIT $' + (params.length - 1) + ' OFFSET $' + params.length;

    // Get total count
    const countResult = await query(countQuery, params.slice(0, params.length - 2));
    const total = (countResult as any).rows[0].count;

    // Get permissions
    const result = await query(dataQuery, params);
    const permissions = (result as any).rows;

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: permissions,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching permissions', err);
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
 * Get permission by ID
 * GET /api/permissions/:permissionId
 */
router.get(
  '/:permissionId',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { permissionId } = req.params;

      const result = await query(
        `SELECT id, name, description, module, action, created_at, updated_at
         FROM permissions WHERE id = $1`,
        [permissionId]
      );

      const rows = (result as any).rows;
      if (rows.length === 0) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Permission not found',
          },
          timestamp: new Date(),
        });
        return;
      }

      const permission = rows[0];

      const response: ApiResponse<any> = {
        success: true,
        data: permission,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching permission', err);
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
 * Create new permission
 * POST /api/permissions
 */
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  requirePermission('permissions:create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, module, action } = req.body;

      if (!name || !module || !action) {
        throw new AppError(
          'INVALID_INPUT',
          400,
          'Name, module, and action are required'
        );
      }

      // Check if permission already exists
      const existResult = await query(
        'SELECT id FROM permissions WHERE name = $1',
        [name]
      );
      if ((existResult as any).rows.length > 0) {
        throw new AppError('CONFLICT', 409, 'Permission already exists');
      }

      // Create permission
      const result = await query(
        `INSERT INTO permissions (name, description, module, action, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id, name, description, module, action, created_at, updated_at`,
        [name, description || null, module, action]
      );

      const permission = (result as any).rows[0];

      logger.info('Permission created', {
        permissionId: permission.id,
        name,
        userId: req.context?.userId,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: permission,
        timestamp: new Date(),
      };

      res.status(201).json(response);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
          timestamp: new Date(),
        });
      } else {
        logger.error('Error creating permission', err);
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
  }
);

/**
 * Update permission
 * PUT /api/permissions/:permissionId
 */
router.put(
  '/:permissionId',
  authMiddleware,
  requireRole('admin'),
  requirePermission('permissions:update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { permissionId } = req.params;
      const { name, description, module, action } = req.body;

      // Check if permission exists
      const existResult = await query(
        'SELECT id FROM permissions WHERE id = $1',
        [permissionId]
      );
      if ((existResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Permission not found');
      }

      // Update permission
      const result = await query(
        `UPDATE permissions
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             module = COALESCE($3, module),
             action = COALESCE($4, action),
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, name, description, module, action, created_at, updated_at`,
        [name || null, description || null, module || null, action || null, permissionId]
      );

      const permission = (result as any).rows[0];

      logger.info('Permission updated', { permissionId, userId: req.context?.userId });

      const response: ApiResponse<any> = {
        success: true,
        data: permission,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
          timestamp: new Date(),
        });
      } else {
        logger.error('Error updating permission', err);
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
  }
);

/**
 * Delete permission
 * DELETE /api/permissions/:permissionId
 */
router.delete(
  '/:permissionId',
  authMiddleware,
  requireRole('admin'),
  requirePermission('permissions:delete'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { permissionId } = req.params;

      // Check if permission exists
      const existResult = await query(
        'SELECT id FROM permissions WHERE id = $1',
        [permissionId]
      );
      if ((existResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Permission not found');
      }

      // Check if permission is assigned to roles
      const roleResult = await query(
        'SELECT COUNT(*) as count FROM role_permissions WHERE permission_id = $1',
        [permissionId]
      );
      if ((roleResult as any).rows[0].count > 0) {
        throw new AppError(
          'CONFLICT',
          409,
          'Cannot delete permission that is assigned to roles'
        );
      }

      // Delete permission
      await query('DELETE FROM permissions WHERE id = $1', [permissionId]);

      logger.info('Permission deleted', { permissionId, userId: req.context?.userId });

      const response: ApiResponse<null> = {
        success: true,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          success: false,
          error: {
            code: err.code,
            message: err.message,
          },
          timestamp: new Date(),
        });
      } else {
        logger.error('Error deleting permission', err);
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
  }
);

/**
 * Get permissions by module
 * GET /api/permissions/module/:module
 */
router.get(
  '/module/:module',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { module } = req.params;

      const result = await query(
        `SELECT id, name, description, module, action, created_at, updated_at
         FROM permissions WHERE module = $1
         ORDER BY action ASC`,
        [module]
      );

      const permissions = (result as any).rows;

      const response: ApiResponse<any[]> = {
        success: true,
        data: permissions,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error fetching permissions by module', err);
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
