import { Router, Request, Response } from 'express';
import { authMiddleware } from '@/middleware/auth.js';
import logger from '@/utils/logger.js';
import {
  getConnectedUsersCount,
  getUserSocketCount,
  getConnectedUsers,
  isUserConnected,
  getWebSocketStats,
} from '@/services/websocket.js';

const router = Router();

/**
 * GET /api/websocket/stats
 * Get WebSocket server statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = getWebSocketStats();

    res.json({
      timestamp: new Date(),
      stats,
    });
  } catch (err) {
    logger.error('Error getting WebSocket stats', err);
    res.status(500).json({ error: 'Failed to get WebSocket statistics' });
  }
});

/**
 * GET /api/websocket/users/connected
 * Get count of connected users
 */
router.get('/users/connected', authMiddleware, async (req: Request, res: Response) => {
  try {
    const count = getConnectedUsersCount();

    res.json({
      connectedUsers: count,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Error getting connected users count', err);
    res.status(500).json({ error: 'Failed to get connected users count' });
  }
});

/**
 * GET /api/websocket/users/:userId/sockets
 * Get socket count for specific user
 */
router.get('/users/:userId/sockets', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const count = getUserSocketCount(userId);
    const isConnected = isUserConnected(userId);

    res.json({
      userId,
      socketCount: count,
      isConnected,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Error getting user socket count', err);
    res.status(500).json({ error: 'Failed to get user socket count' });
  }
});

/**
 * GET /api/websocket/users/list
 * Get list of all connected users
 */
router.get('/users/list', authMiddleware, async (req: Request, res: Response) => {
  try {
    const users = getConnectedUsers();

    res.json({
      count: users.length,
      users,
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error('Error getting connected users list', err);
    res.status(500).json({ error: 'Failed to get connected users list' });
  }
});

/**
 * GET /api/websocket/health
 * Check WebSocket service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = getWebSocketStats();

    res.json({
      status: 'healthy',
      service: 'websocket',
      timestamp: new Date(),
      stats,
    });
  } catch (err) {
    logger.error('Error checking WebSocket service health', err);
    res.status(500).json({ status: 'unhealthy', error: 'WebSocket service error' });
  }
});

export default router;
