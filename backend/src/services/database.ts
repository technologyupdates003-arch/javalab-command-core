import { Pool, PoolClient } from 'pg';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';

let pool: Pool | null = null;

export async function initializeDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle client', err);
  });

  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection established successfully');
  } catch (err) {
    logger.error('Failed to connect to database', err);
    throw err;
  }

  return pool;
}

export async function getDatabase(): Promise<Pool> {
  if (!pool) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

export async function query(text: string, params?: unknown[]): Promise<unknown> {
  const db = await getDatabase();
  return db.query(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const db = await getDatabase();
  return db.connect();
}
