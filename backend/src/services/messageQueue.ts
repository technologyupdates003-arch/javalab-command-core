import amqp, { Connection, Channel } from 'amqplib';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';
import { QueuedTask } from '@/types/index.js';

let connection: Connection | null = null;
let channel: Channel | null = null;

const QUEUE_NAMES = {
  EMAIL: 'email_queue',
  SMS: 'sms_queue',
  NOTIFICATIONS: 'notifications_queue',
  REPORTS: 'reports_queue',
  BILLING: 'billing_queue',
  PAYROLL: 'payroll_queue',
};

export async function initializeMessageQueue(): Promise<Channel> {
  if (channel) {
    return channel;
  }

  try {
    connection = await amqp.connect(config.messageQueue.url);
    channel = await connection.createChannel();

    // Declare all queues
    for (const queueName of Object.values(QUEUE_NAMES)) {
      await channel.assertQueue(queueName, { durable: true });
    }

    logger.info('Message queue connection established successfully');
  } catch (err) {
    logger.error('Failed to connect to message queue', err);
    throw err;
  }

  return channel;
}

export async function getMessageQueue(): Promise<Channel> {
  if (!channel) {
    throw new Error('Message queue not initialized. Call initializeMessageQueue first.');
  }
  return channel;
}

export async function closeMessageQueue(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }

  if (connection) {
    await connection.close();
    connection = null;
  }

  logger.info('Message queue connection closed');
}

export async function publishTask(
  queueName: string,
  task: QueuedTask
): Promise<void> {
  const mq = await getMessageQueue();
  const message = JSON.stringify(task);

  mq.sendToQueue(queueName, Buffer.from(message), {
    persistent: true,
    contentType: 'application/json',
  });

  logger.debug(`Task published to queue: ${queueName}`, { taskId: task.id });
}

export async function consumeQueue(
  queueName: string,
  handler: (task: QueuedTask) => Promise<void>,
  prefetch: number = 1
): Promise<void> {
  const mq = await getMessageQueue();

  await mq.prefetch(prefetch);

  await mq.consume(queueName, async (msg) => {
    if (!msg) {
      return;
    }

    try {
      const task = JSON.parse(msg.content.toString()) as QueuedTask;
      await handler(task);
      mq.ack(msg);
      logger.debug(`Task processed from queue: ${queueName}`, { taskId: task.id });
    } catch (err) {
      logger.error(`Error processing task from queue: ${queueName}`, err);
      // Requeue the message
      mq.nack(msg, false, true);
    }
  });

  logger.info(`Started consuming queue: ${queueName}`);
}

export { QUEUE_NAMES };
