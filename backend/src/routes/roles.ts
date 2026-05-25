import { Router, Request, Response } from 'express';
import { query } from '@/services/database.js';
import { authMiddleware, requireRole } from '@/middleware/auth.js';
import { requirePermission } from '@/middleware/rbac.js';
import logger from '@/utils/logger.js';
import { AppError, ApiResponse, PaginatedResponse } from '@/types/index.js';

const router = Router();

/**
 * Get all roles
 * GET /api/roles
 */
router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = ((Number(page) - 1) * Number(pageSize)) as number;

    // Get total count
    const countResult = await query('SELECT COUNT(*) as count FROM roles');
    const total = (countResult as any).rows[0].count;

    // Get roles
    const result = await query(
      `SELECT id, name, description, created_at, updated_at
       FROM roles
       ORDER BY name ASC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    const roles = (result as any).rows;

    const response: ApiResponse<PaginatedResponse<any>> = {
      success: true,
      data: {
        data: roles,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize)),
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching roles', err);
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
 * Get role by ID
 * GET /api/roles/:roleId
 */
router.get('/:roleId', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { roleId } = req.params;

    const result = await query(
      `SELECT id, name, description, created_at, updated_at
       FROM roles WHERE id = $1`,
      [roleId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Role not found',
        },
        timestamp: new Date(),
      });
      return;
    }

    const role = rows[0];

    // Get permissions for this role
    const permResult = await query(
      `SELECT p.id, p.name, p.description, p.module, p.action
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1`,
      [roleId]
    );

    const permissions = (permResult as any).rows;

    const response: ApiResponse<any> = {
      success: true,
      data: {
        ...role,
        permissions,
      },
      timestamp: new Date(),
    };

    res.json(response);
  } catch (err) {
    logger.error('Error fetching role', err);
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
 * Create new role
 * POST /api/roles
 */
router.post(
  '/',
  authMiddleware,
  requireRole('admin'),
  requirePermission('roles:create'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description } = req.body;

      if (!name) {
        throw new AppError('INVALID_INPUT', 400, 'Role name is required');
      }

      // Check if role already exists
      const existResult = await query('SELECT id FROM roles WHERE name = $1', [name]);
      if ((existResult as any).rows.length > 0) {
        throw new AppError('CONFLICT', 409, 'Role already exists');
      }

      // Create role
      const result = await query(
        `INSERT INTO roles (name, description, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id, name, description, created_at, updated_at`,
        [name, description || null]
      );

      const role = (result as any).rows[0];

      logger.info('Role created', { roleId: role.id, name, userId: req.context?.userId });

      const response: ApiResponse<any> = {
        success: true,
        data: role,
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
        logger.error('Error creating role', err);
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
 * Update role
 * PUT /api/roles/:roleId
 */
router.put(
  '/:roleId',
  authMiddleware,
  requireRole('admin'),
  requirePermission('roles:update'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const { name, description } = req.body;

      // Check if role exists
      const existResult = await query('SELECT id FROM roles WHERE id = $1', [roleId]);
      if ((existResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Role not found');
      }

      // Update role
      const result = await query(
        `UPDATE roles SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = NOW()
         WHERE id = $3
         RETURNING id, name, description, created_at, updated_at`,
        [name || null, description || null, roleId]
      );

      const role = (result as any).rows[0];

      logger.info('Role updated', { roleId, userId: req.context?.userId });

      const response: ApiResponse<any> = {
        success: true,
        data: role,
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
        logger.error('Error updating role', err);
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
 * Delete role
 * DELETE /api/roles/:roleId
 */
router.delete(
  '/:roleId',
  authMiddleware,
  requireRole('admin'),
  requirePermission('roles:delete'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;

      // Check if role exists
      const existResult = await query('SELECT id FROM roles WHERE id = $1', [roleId]);
      if ((existResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Role not found');
      }

      // Check if role is assigned to users
      const userResult = await query('SELECT COUNT(*) as count FROM users WHERE role = $1', [
        roleId,
      ]);
      if ((userResult as any).rows[0].count > 0) {
        throw new AppError(
          'CONFLICT',
          409,
          'Cannot delete role that is assigned to users'
        );
      }

      // Delete role permissions
      await query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

      // Delete role
      await query('DELETE FROM roles WHERE id = $1', [roleId]);

      logger.info('Role deleted', { roleId, userId: req.context?.userId });

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
        logger.error('Error deleting role', err);
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
 * Add permission to role
 * POST /api/roles/:roleId/permissions
 */
router.post(
  '/:roleId/permissions',
  authMiddleware,
  requireRole('admin'),
  requirePermission('roles:manage_permissions'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const { permissionId } = req.body;

      if (!permissionId) {
        throw new AppError('INVALID_INPUT', 400, 'Permission ID is required');
      }

      // Check if role exists
      const roleResult = await query('SELECT id FROM roles WHERE id = $1', [roleId]);
      if ((roleResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Role not found');
      }

      // Check if permission exists
      const permResult = await query('SELECT id FROM permissions WHERE id = $1', [permissionId]);
      if ((permResult as any).rows.length === 0) {
        throw new AppError('NOT_FOUND', 404, 'Permission not found');
      }

      // Check if permission already assigned
      const existResult = await query(
        'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );
      if ((existResult as any).rows.length > 0) {
        throw new AppError('CONFLICT', 409, 'Permission already assigned to role');
      }

      // Add permission to role
      await query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [roleId, permissionId]
      );

      logger.info('Permission added to role', { roleId, permissionId, userId: req.context?.userId });

      const response: ApiResponse<null> = {
        success: true,
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
        logger.error('Error adding permission to role', err);
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
 * Remove permission from role
 * DELETE /api/roles/:roleId/permissions/:permissionId
 */
router.delete(
  '/:roleId/permissions/:permissionId',
  authMiddleware,
  requireRole('admin'),
  requirePermission('roles:manage_permissions'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId, permissionId } = req.params;

      // Delete permission from role
      const result = await query(
        'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [roleId, permissionId]
      );

      logger.info('Permission removed from role', {
        roleId,
        permissionId,
        userId: req.context?.userId,
      });

      const response: ApiResponse<null> = {
        success: true,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (err) {
      logger.error('Error removing permission from role', err);
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
