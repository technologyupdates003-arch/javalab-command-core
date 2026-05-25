import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';

let redisClient: RedisClientType | null = null;

export async function initializeCache(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    host: config.redis.host,
    port: config.redis.port,
    db: config.redis.db,
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    logger.error('Redis client error', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  try {
    await redisClient.connect();
    await redisClient.ping();
    logger.info('Redis connection established successfully');
  } catch (err) {
    logger.error('Failed to connect to Redis', err);
    throw err;
  }

  return redisClient;
}

export async function getCache(): Promise<RedisClientType> {
  if (!redisClient) {
    throw new Error('Cache not initialized. Call initializeCache first.');
  }
  return redisClient;
}

export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

export async function set(key: string, value: unknown, ttl?: number): Promise<void> {
  const cache = await getCache();
  const serialized = JSON.stringify(value);

  if (ttl) {
    await cache.setEx(key, ttl, serialized);
  } else {
    await cache.set(key, serialized);
  }
}

export async function get<T>(key: string): Promise<T | null> {
  const cache = await getCache();
  const value = await cache.get(key);

  if (!value) {
    return null;
  }

  return JSON.parse(value) as T;
}

export async function del(key: string): Promise<void> {
  const cache = await getCache();
  await cache.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const cache = await getCache();
  const keys = await cache.keys(pattern);

  if (keys.length > 0) {
    await cache.del(keys);
  }
}

export async function exists(key: string): Promise<boolean> {
  const cache = await getCache();
  const result = await cache.exists(key);
  return result === 1;
}
