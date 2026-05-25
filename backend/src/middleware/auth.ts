import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';
import { JWTPayload, RequestContext, AppError } from '@/types/index.js';

declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 401, 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    req.context = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
    };

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: err.message });
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
        timestamp: new Date(),
      });
    } else if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
        },
        timestamp: new Date(),
      });
    } else {
      logger.error('Authentication error', err);
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

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      req.context = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
      };
    }

    next();
  } catch (err) {
    logger.warn('Optional auth failed, continuing without authentication', { error: err });
    next();
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.context) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date(),
      });
      return;
    }

    if (!req.context.permissions.includes(permission)) {
      logger.warn('Permission denied', {
        userId: req.context.userId,
        permission,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.context) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date(),
      });
      return;
    }

    if (!roles.includes(req.context.role)) {
      logger.warn('Role denied', {
        userId: req.context.userId,
        requiredRoles: roles,
        userRole: req.context.role,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role',
        },
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
}
