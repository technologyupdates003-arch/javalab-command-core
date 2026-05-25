import { getMessageQueue, QUEUE_NAMES } from '@/services/messageQueue.js';
import { query } from '@/services/database.js';
import logger from '@/utils/logger.js';
import { QueuedTask } from '@/types/index.js';

/**
 * Queue Manager Service
 * Handles task queuing, retry logic, and exponential backoff
 */

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000, // 1 second
  MAX_DELAY: 60000, // 1 minute
  BACKOFF_MULTIPLIER: 2,
};

// Dead letter queue for failed tasks
const DEAD_LETTER_QUEUE = 'dead_letter_queue';

/**
 * Queue a task with retry logic
 */
export async function queueTask(
  type: string,
  payload: Record<string, unknown>,
  priority: 'low' | 'normal' | 'high' = 'normal',
  maxRetries: number = RETRY_CONFIG.MAX_RETRIES
): Promise<string> {
  try {
    const mq = await getMessageQueue();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: QueuedTask = {
      id: taskId,
      type,
      payload,
      priority,
      createdAt: new Date(),
      status: 'pending',
      retries: 0,
      maxRetries,
    };

    // Determine queue based on task type
    const queueName = getQueueForTaskType(type);

    // Publish to queue
    const channel = mq;
    const message = JSON.stringify(task);

    channel.sendToQueue(queueName, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
      priority: getPriorityValue(priority),
    });

    // Store in database for tracking
    await query(
      `INSERT INTO queued_tasks (id, type, payload, priority, status, retries, max_retries, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [taskId, type, JSON.stringify(payload), priority, 'pending', 0, maxRetries, new Date()]
    );

    logger.info('Task queued', { taskId, type, priority });

    return taskId;
  } catch (err) {
    logger.error('Error queuing task', err);
    throw err;
  }
}

/**
 * Retry a failed task with exponential backoff
 */
export async function retryTask(task: QueuedTask): Promise<boolean> {
  try {
    if (task.retries >= task.maxRetries) {
      // Move to dead letter queue
      await moveToDeadLetterQueue(task);
      return false;
    }

    // Calculate delay with exponential backoff
    const delay = calculateBackoffDelay(task.retries);

    // Schedule retry
    setTimeout(async () => {
      try {
        const mq = await getMessageQueue();
        const queueName = getQueueForTaskType(task.type);

        // Increment retry count
        task.retries += 1;
        task.status = 'pending';

        const message = JSON.stringify(task);
        mq.sendToQueue(queueName, Buffer.from(message), {
          persistent: true,
          contentType: 'application/json',
          priority: getPriorityValue(task.priority),
        });

        // Update in database
        await query(
          `UPDATE queued_tasks SET retries = $1, status = $2, updated_at = $3 WHERE id = $4`,
          [task.retries, 'pending', new Date(), task.id]
        );

        logger.info('Task retried', {
          taskId: task.id,
          type: task.type,
          attempt: task.retries,
          delay,
        });
      } catch (err) {
        logger.error('Error retrying task', { taskId: task.id, error: err });
      }
    }, delay);

    return true;
  } catch (err) {
    logger.error('Error in retry logic', err);
    throw err;
  }
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(retryCount: number): number {
  const delay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, retryCount);
  return Math.min(delay, RETRY_CONFIG.MAX_DELAY);
}

/**
 * Move task to dead letter queue
 */
export async function moveToDeadLetterQueue(task: QueuedTask): Promise<void> {
  try {
    const mq = await getMessageQueue();

    task.status = 'failed';
    const message = JSON.stringify(task);

    mq.sendToQueue(DEAD_LETTER_QUEUE, Buffer.from(message), {
      persistent: true,
      contentType: 'application/json',
    });

    // Update in database
    await query(
      `UPDATE queued_tasks SET status = $1, updated_at = $2 WHERE id = $3`,
      ['failed', new Date(), task.id]
    );

    logger.warn('Task moved to dead letter queue', {
      taskId: task.id,
      type: task.type,
      retries: task.retries,
    });
  } catch (err) {
    logger.error('Error moving task to dead letter queue', err);
    throw err;
  }
}

/**
 * Get queue name for task type
 */
export function getQueueForTaskType(type: string): string {
  const typeMap: Record<string, string> = {
    'email': QUEUE_NAMES.EMAIL,
    'sms': QUEUE_NAMES.SMS,
    'notification': QUEUE_NAMES.NOTIFICATIONS,
    'report': QUEUE_NAMES.REPORTS,
    'billing': QUEUE_NAMES.BILLING,
    'payroll': QUEUE_NAMES.PAYROLL,
  };

  return typeMap[type] || QUEUE_NAMES.NOTIFICATIONS;
}

/**
 * Get priority value for queue
 */
export function getPriorityValue(priority: 'low' | 'normal' | 'high'): number {
  const priorityMap = {
    low: 0,
    normal: 5,
    high: 10,
  };

  return priorityMap[priority];
}

/**
 * Mark task as completed
 */
export async function completeTask(taskId: string): Promise<void> {
  try {
    await query(
      `UPDATE queued_tasks SET status = $1, processed_at = $2, updated_at = $3 WHERE id = $4`,
      ['completed', new Date(), new Date(), taskId]
    );

    logger.info('Task completed', { taskId });
  } catch (err) {
    logger.error('Error completing task', { taskId, error: err });
    throw err;
  }
}

/**
 * Mark task as failed
 */
export async function failTask(taskId: string, error: string): Promise<void> {
  try {
    await query(
      `UPDATE queued_tasks SET status = $1, error = $2, updated_at = $3 WHERE id = $4`,
      ['failed', error, new Date(), taskId]
    );

    logger.error('Task failed', { taskId, error });
  } catch (err) {
    logger.error('Error failing task', { taskId, error: err });
    throw err;
  }
}

/**
 * Get task status
 */
export async function getTaskStatus(taskId: string): Promise<QueuedTask | null> {
  try {
    const result = await query('SELECT * FROM queued_tasks WHERE id = $1', [taskId]);

    const rows = (result as any).rows;
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload),
      priority: row.priority,
      createdAt: row.created_at,
      processedAt: row.processed_at,
      status: row.status,
      retries: row.retries,
      maxRetries: row.max_retries,
      error: row.error,
    };
  } catch (err) {
    logger.error('Error getting task status', { taskId, error: err });
    return null;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}> {
  try {
    const result = await query(
      `SELECT status, COUNT(*) as count FROM queued_tasks GROUP BY status`
    );

    const rows = (result as any).rows;
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };

    for (const row of rows) {
      stats[row.status as keyof typeof stats] = row.count;
      stats.total += row.count;
    }

    return stats;
  } catch (err) {
    logger.error('Error getting queue statistics', err);
    throw err;
  }
}

/**
 * Get failed tasks
 */
export async function getFailedTasks(limit: number = 100): Promise<QueuedTask[]> {
  try {
    const result = await query(
      `SELECT * FROM queued_tasks WHERE status = 'failed' ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );

    const rows = (result as any).rows;
    return rows.map((row: any) => ({
      id: row.id,
      type: row.type,
      payload: JSON.parse(row.payload),
      priority: row.priority,
      createdAt: row.created_at,
      processedAt: row.processed_at,
      status: row.status,
      retries: row.retries,
      maxRetries: row.max_retries,
      error: row.error,
    }));
  } catch (err) {
    logger.error('Error getting failed tasks', err);
    throw err;
  }
}

/**
 * Purge old completed tasks
 */
export async function purgeOldTasks(daysOld: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    const result = await query(
      `DELETE FROM queued_tasks WHERE status = 'completed' AND created_at < $1`,
      [cutoffDate]
    );

    const deletedCount = (result as any).rowCount || 0;

    logger.info('Old tasks purged', { daysOld, deletedCount });

    return deletedCount;
  } catch (err) {
    logger.error('Error purging old tasks', err);
    throw err;
  }
}

/**
 * Setup queue monitoring
 */
export function setupQueueMonitoring(): void {
  // Monitor queue stats every 5 minutes
  setInterval(async () => {
    try {
      const stats = await getQueueStats();
      logger.info('Queue statistics', stats);
    } catch (err) {
      logger.error('Error monitoring queue', err);
    }
  }, 5 * 60 * 1000);

  // Purge old tasks every day
  setInterval(async () => {
    try {
      const deletedCount = await purgeOldTasks(30);
      if (deletedCount > 0) {
        logger.info(`Purged ${deletedCount} old tasks`);
      }
    } catch (err) {
      logger.error('Error purging old tasks', err);
    }
  }, 24 * 60 * 60 * 1000);

  logger.info('Queue monitoring setup');
}
