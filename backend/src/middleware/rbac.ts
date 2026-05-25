import { Request, Response, NextFunction } from 'express';
import { query } from '@/services/database.js';
import { get, set } from '@/services/cache.js';
import logger from '@/utils/logger.js';
import { AppError } from '@/types/index.js';

/**
 * Check if user has a specific permission
 */
export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.context) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
      }

      // Check if permission is in user's permissions
      if (!req.context.permissions.includes(permission)) {
        logger.warn('Permission denied', {
          userId: req.context.userId,
          permission,
          userPermissions: req.context.permissions,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Permission '${permission}' required`,
          },
          timestamp: new Date(),
        });
        return;
      }

      next();
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
        logger.error('Permission check error', err);
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
  };
}

/**
 * Check if user has any of the specified permissions
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.context) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
      }

      const hasPermission = permissions.some((perm) =>
        req.context!.permissions.includes(perm)
      );

      if (!hasPermission) {
        logger.warn('Any permission denied', {
          userId: req.context.userId,
          requiredPermissions: permissions,
          userPermissions: req.context.permissions,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `One of these permissions required: ${permissions.join(', ')}`,
          },
          timestamp: new Date(),
        });
        return;
      }

      next();
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
        logger.error('Permission check error', err);
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
  };
}

/**
 * Check if user has all specified permissions
 */
export function requireAllPermissions(...permissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.context) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
      }

      const missingPermissions = permissions.filter(
        (perm) => !req.context!.permissions.includes(perm)
      );

      if (missingPermissions.length > 0) {
        logger.warn('All permissions denied', {
          userId: req.context.userId,
          missingPermissions,
          userPermissions: req.context.permissions,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `All of these permissions required: ${permissions.join(', ')}`,
          },
          timestamp: new Date(),
        });
        return;
      }

      next();
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
        logger.error('Permission check error', err);
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
  };
}

/**
 * Check if user has access to a specific module
 */
export function requireModuleAccess(module: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.context) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
      }

      // Check cache first
      const cacheKey = `module_access:${req.context.userId}:${module}`;
      const cached = await get<boolean>(cacheKey);

      if (cached !== null) {
        if (!cached) {
          throw new AppError('FORBIDDEN', 403, `Access to module '${module}' denied`);
        }
        next();
        return;
      }

      // Query database for module access
      const result = await query(
        `SELECT COUNT(*) as count FROM role_modules rm
         JOIN roles r ON rm.role_id = r.id
         JOIN users u ON u.role = r.name
         WHERE u.id = $1 AND rm.module = $2`,
        [req.context.userId, module]
      );

      const rows = (result as any).rows;
      const hasAccess = rows[0].count > 0;

      // Cache the result
      await set(cacheKey, hasAccess, 3600); // 1 hour

      if (!hasAccess) {
        logger.warn('Module access denied', {
          userId: req.context.userId,
          module,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Access to module '${module}' denied`,
          },
          timestamp: new Date(),
        });
        return;
      }

      next();
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
        logger.error('Module access check error', err);
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
  };
}

/**
 * Check if user has record-level access
 */
export function requireRecordAccess(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.context) {
        throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
      }

      const recordId = req.params.id || req.body?.id;

      if (!recordId) {
        next();
        return;
      }

      // Check cache first
      const cacheKey = `record_access:${req.context.userId}:${resourceType}:${recordId}`;
      const cached = await get<boolean>(cacheKey);

      if (cached !== null) {
        if (!cached) {
          throw new AppError('FORBIDDEN', 403, 'Access to this record denied');
        }
        next();
        return;
      }

      // Query database for record access
      const result = await query(
        `SELECT COUNT(*) as count FROM record_access ra
         WHERE ra.user_id = $1 AND ra.resource_type = $2 AND ra.resource_id = $3`,
        [req.context.userId, resourceType, recordId]
      );

      const rows = (result as any).rows;
      const hasAccess = rows[0].count > 0;

      // Cache the result
      await set(cacheKey, hasAccess, 3600); // 1 hour

      if (!hasAccess) {
        logger.warn('Record access denied', {
          userId: req.context.userId,
          resourceType,
          recordId,
        });

        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Access to this record denied',
          },
          timestamp: new Date(),
        });
        return;
      }

      next();
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
        logger.error('Record access check error', err);
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
  };
}

/**
 * Middleware to load user permissions from database
 */
export async function loadUserPermissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.context) {
      next();
      return;
    }

    // Check cache first
    const cacheKey = `user_permissions:${req.context.userId}`;
    const cached = await get<string[]>(cacheKey);

    if (cached) {
      req.context.permissions = cached;
      next();
      return;
    }

    // Query database for permissions
    const result = await query(
      `SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       JOIN users u ON u.role = r.name
       WHERE u.id = $1`,
      [req.context.userId]
    );

    const permissions = ((result as any).rows || []).map((row: any) => row.name);

    // Cache permissions for 1 hour
    await set(cacheKey, permissions, 3600);

    req.context.permissions = permissions;
    next();
  } catch (err) {
    logger.error('Error loading user permissions', err);
    // Continue without permissions rather than blocking
    next();
  }
}

/**
 * Invalidate user permission cache
 */
export async function invalidateUserPermissions(userId: string): Promise<void> {
  try {
    const cacheKey = `user_permissions:${userId}`;
    const cache = await import('@/services/cache.js');
    await cache.del(cacheKey);
    logger.info('User permissions cache invalidated', { userId });
  } catch (err) {
    logger.error('Error invalidating user permissions', err);
  }
}

/**
 * Invalidate module access cache
 */
export async function invalidateModuleAccess(userId: string, module: string): Promise<void> {
  try {
    const cacheKey = `module_access:${userId}:${module}`;
    const cache = await import('@/services/cache.js');
    await cache.del(cacheKey);
    logger.info('Module access cache invalidated', { userId, module });
  } catch (err) {
    logger.error('Error invalidating module access', err);
  }
}

/**
 * Invalidate record access cache
 */
export async function invalidateRecordAccess(
  userId: string,
  resourceType: string,
  recordId: string
): Promise<void> {
  try {
    const cacheKey = `record_access:${userId}:${resourceType}:${recordId}`;
    const cache = await import('@/services/cache.js');
    await cache.del(cacheKey);
    logger.info('Record access cache invalidated', { userId, resourceType, recordId });
  } catch (err) {
    logger.error('Error invalidating record access', err);
  }
}
