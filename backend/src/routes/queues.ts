import { Router, Request, Response } from 'express';
import { authMiddleware, requirePermission } from '@/middleware/auth.js';
import logger from '@/utils/logger.js';
import {
  queueTask,
  getTaskStatus,
  getQueueStats,
  getFailedTasks,
  purgeOldTasks,
  completeTask,
  failTask,
} from '@/services/queueManager.js';

const router = Router();

/**
 * POST /api/queues/tasks
 * Queue a new task
 */
router.post('/tasks', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { type, payload, priority = 'normal', maxRetries = 3 } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'Missing required fields: type, payload' });
    }

    const taskId = await queueTask(type, payload, priority, maxRetries);

    res.status(201).json({
      message: 'Task queued successfully',
      taskId,
      type,
      priority,
    });
  } catch (err) {
    logger.error('Error queuing task', err);
    res.status(500).json({ error: 'Failed to queue task' });
  }
});

/**
 * GET /api/queues/tasks/:taskId
 * Get task status
 */
router.get('/tasks/:taskId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const task = await getTaskStatus(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      taskId: task.id,
      type: task.type,
      payload: task.payload,
      priority: task.priority,
      status: task.status,
      retries: task.retries,
      maxRetries: task.maxRetries,
      createdAt: task.createdAt,
      processedAt: task.processedAt,
      error: task.error,
    });
  } catch (err) {
    logger.error('Error getting task status', err);
    res.status(500).json({ error: 'Failed to get task status' });
  }
});

/**
 * GET /api/queues/stats
 * Get queue statistics
 */
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();

    res.json({
      timestamp: new Date(),
      stats,
    });
  } catch (err) {
    logger.error('Error getting queue stats', err);
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

/**
 * GET /api/queues/failed
 * Get failed tasks
 * Requires 'queue:manage' permission
 */
router.get(
  '/failed',
  authMiddleware,
  requirePermission('queue:manage'),
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      const failedTasks = await getFailedTasks(limit);

      res.json({
        count: failedTasks.length,
        tasks: failedTasks.map((task) => ({
          taskId: task.id,
          type: task.type,
          payload: task.payload,
          priority: task.priority,
          status: task.status,
          retries: task.retries,
          maxRetries: task.maxRetries,
          createdAt: task.createdAt,
          error: task.error,
        })),
      });
    } catch (err) {
      logger.error('Error getting failed tasks', err);
      res.status(500).json({ error: 'Failed to get failed tasks' });
    }
  }
);

/**
 * POST /api/queues/tasks/:taskId/complete
 * Mark task as completed
 * Requires 'queue:manage' permission
 */
router.post(
  '/tasks/:taskId/complete',
  authMiddleware,
  requirePermission('queue:manage'),
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;

      await completeTask(taskId);

      res.json({
        message: 'Task marked as completed',
        taskId,
      });
    } catch (err) {
      logger.error('Error completing task', err);
      res.status(500).json({ error: 'Failed to complete task' });
    }
  }
);

/**
 * POST /api/queues/tasks/:taskId/fail
 * Mark task as failed
 * Requires 'queue:manage' permission
 */
router.post(
  '/tasks/:taskId/fail',
  authMiddleware,
  requirePermission('queue:manage'),
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const { error } = req.body;

      if (!error) {
        return res.status(400).json({ error: 'Missing required field: error' });
      }

      await failTask(taskId, error);

      res.json({
        message: 'Task marked as failed',
        taskId,
        error,
      });
    } catch (err) {
      logger.error('Error failing task', err);
      res.status(500).json({ error: 'Failed to fail task' });
    }
  }
);

/**
 * POST /api/queues/purge
 * Purge old completed tasks
 * Requires 'queue:manage' permission (admin only)
 */
router.post(
  '/purge',
  authMiddleware,
  requirePermission('queue:manage'),
  async (req: Request, res: Response) => {
    try {
      const { daysOld = 30 } = req.body;

      const deletedCount = await purgeOldTasks(daysOld);

      res.json({
        message: 'Old tasks purged',
        daysOld,
        deletedCount,
      });
    } catch (err) {
      logger.error('Error purging old tasks', err);
      res.status(500).json({ error: 'Failed to purge old tasks' });
    }
  }
);

/**
 * GET /api/queues/health
 * Check queue service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();

    res.json({
      status: 'healthy',
      service: 'queues',
      timestamp: new Date(),
      stats,
    });
  } catch (err) {
    logger.error('Error checking queue service health', err);
    res.status(500).json({ status: 'unhealthy', error: 'Queue service error' });
  }
});

export default router;
