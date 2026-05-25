import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import { config } from '@/config/index.js';
import { query } from '@/services/database.js';
import { set, get } from '@/services/cache.js';
import { authRateLimiter } from '@/middleware/rateLimit.js';
import logger from '@/utils/logger.js';
import { AppError, ApiResponse, AuthResponse, User } from '@/types/index.js';

const router = Router();

/**
 * Login endpoint
 * POST /api/auth/login
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('INVALID_INPUT', 400, 'Email and password are required');
    }

    // Query user from database
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, status, two_fa_enabled
       FROM users WHERE email = $1`,
      [email]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    const user = rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      logger.warn('Login attempt with inactive user', { email, status: user.status });
      throw new AppError('USER_INACTIVE', 403, 'User account is inactive');
    }

    // Verify password
    const passwordMatch = await bcryptjs.compare(password, user.password_hash);
    if (!passwordMatch) {
      logger.warn('Login attempt with wrong password', { email });
      throw new AppError('INVALID_CREDENTIALS', 401, 'Invalid email or password');
    }

    // Get user permissions
    const permResult = await query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       WHERE r.name = $1`,
      [user.role]
    );

    const permissions = (permResult as any).rows.map((row: any) => row.name);

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );

    // Cache token for quick validation
    await set(`token:${token}`, { userId: user.id, role: user.role }, 86400);

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Log successful login
    logger.info('User logged in successfully', { userId: user.id, email });

    const userData: User = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      twoFaEnabled: user.two_fa_enabled,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        token,
        user: userData,
      },
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
      logger.error('Login error', err);
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
});

/**
 * Logout endpoint
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const token = req.headers.authorization?.substring(7);
    if (token) {
      // Invalidate token in cache
      await set(`token:blacklist:${token}`, true, 86400);
    }

    logger.info('User logged out', { userId: req.context.userId });

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
      logger.error('Logout error', err);
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
});

/**
 * Verify token endpoint
 * GET /api/auth/verify
 */
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.context) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const response: ApiResponse<{ valid: boolean; userId: string; role: string }> = {
      success: true,
      data: {
        valid: true,
        userId: req.context.userId,
        role: req.context.role,
      },
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
      logger.error('Verify error', err);
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
});

export default router;
