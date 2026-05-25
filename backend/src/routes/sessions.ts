import { Router, Request, Response } from 'express';
import { authMiddleware, requirePermission } from '@/middleware/auth.js';
import logger from '@/utils/logger.js';
import {
  getSession,
  deleteSession,
  invalidateUserSessions,
  extendSession,
  getUserSessionCount,
  cleanupExpiredSessions,
} from '@/services/session.js';

const router = Router();

/**
 * GET /api/sessions/current
 * Get current session information
 */
router.get('/current', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID not found' });
    }

    const session = await getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    res.json({
      sessionId,
      userId: session.userId,
      email: session.email,
      role: session.role,
      permissions: session.permissions,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });
  } catch (err) {
    logger.error('Error getting current session', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

/**
 * POST /api/sessions/extend
 * Extend current session expiry
 */
router.post('/extend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID not found' });
    }

    const expiresAt = await extendSession(sessionId);

    if (!expiresAt) {
      return res.status(404).json({ error: 'Session not found or expired' });
    }

    res.json({
      message: 'Session extended',
      expiresAt,
    });
  } catch (err) {
    logger.error('Error extending session', err);
    res.status(500).json({ error: 'Failed to extend session' });
  }
});

/**
 * DELETE /api/sessions/current
 * Delete current session (logout)
 */
router.delete('/current', authMiddleware, async (req: Request, res: Response) => {
  try {
    const sessionId = req.headers['x-session-id'] as string;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID not found' });
    }

    await deleteSession(sessionId);

    res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    logger.error('Error deleting session', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

/**
 * GET /api/sessions/count
 * Get session count for current user
 */
router.get('/count', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.context?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await getUserSessionCount(userId);

    res.json({
      userId,
      sessionCount: count,
    });
  } catch (err) {
    logger.error('Error getting session count', err);
    res.status(500).json({ error: 'Failed to get session count' });
  }
});

/**
 * POST /api/sessions/invalidate-all
 * Invalidate all sessions for current user
 * Requires 'session:invalidate' permission
 */
router.post(
  '/invalidate-all',
  authMiddleware,
  requirePermission('session:invalidate'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.context?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      await invalidateUserSessions(userId);

      res.json({
        message: 'All user sessions invalidated',
        userId,
      });
    } catch (err) {
      logger.error('Error invalidating user sessions', err);
      res.status(500).json({ error: 'Failed to invalidate sessions' });
    }
  }
);

/**
 * POST /api/sessions/cleanup
 * Cleanup expired sessions
 * Requires 'session:cleanup' permission (admin only)
 */
router.post(
  '/cleanup',
  authMiddleware,
  requirePermission('session:cleanup'),
  async (req: Request, res: Response) => {
    try {
      const deletedCount = await cleanupExpiredSessions();

      res.json({
        message: 'Expired sessions cleaned up',
        deletedCount,
      });
    } catch (err) {
      logger.error('Error cleaning up expired sessions', err);
      res.status(500).json({ error: 'Failed to cleanup sessions' });
    }
  }
);

/**
 * GET /api/sessions/health
 * Check session service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'healthy',
      service: 'sessions',
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Error checking session service health', err);
    res.status(500).json({ status: 'unhealthy', error: 'Session service error' });
  }
});

export default router;
