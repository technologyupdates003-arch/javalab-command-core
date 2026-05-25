import { v4 as uuidv4 } from 'uuid';
import { get, set, del } from '@/services/cache.js';
import { query } from '@/services/database.js';
import logger from '@/utils/logger.js';

export interface SessionData {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 24 * 60 * 60; // 24 hours

/**
 * Create a new session
 */
export async function createSession(
  userId: string,
  email: string,
  role: string,
  permissions: string[],
  ipAddress: string,
  userAgent: string
): Promise<{ sessionId: string; expiresAt: Date }> {
  try {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_TTL * 1000);

    const sessionData: SessionData = {
      userId,
      email,
      role,
      permissions,
      ipAddress,
      userAgent,
      createdAt: new Date(),
      expiresAt,
    };

    // Store in cache
    const cacheKey = `${SESSION_PREFIX}${sessionId}`;
    await set(cacheKey, sessionData, SESSION_TTL);

    // Store in database
    await query(
      `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, sessionId, ipAddress, userAgent, expiresAt]
    );

    logger.info('Session created', { sessionId, userId });

    return { sessionId, expiresAt };
  } catch (err) {
    logger.error('Error creating session', err);
    throw err;
  }
}

/**
 * Get session data
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  try {
    // Check cache first
    const cacheKey = `${SESSION_PREFIX}${sessionId}`;
    const cached = await get<SessionData>(cacheKey);

    if (cached) {
      return cached;
    }

    // Check database
    const result = await query(
      `SELECT user_id, ip_address, user_agent, expires_at FROM sessions WHERE token_hash = $1`,
      [sessionId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      return null;
    }

    const session = rows[0];

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await deleteSession(sessionId);
      return null;
    }

    // Reconstruct session data (permissions would need to be fetched from user)
    const userResult = await query(
      `SELECT email, role FROM users WHERE id = $1`,
      [session.user_id]
    );

    if ((userResult as any).rows.length === 0) {
      return null;
    }

    const user = (userResult as any).rows[0];

    // Get permissions
    const permResult = await query(
      `SELECT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN roles r ON rp.role_id = r.id
       WHERE r.name = $1`,
      [user.role]
    );

    const permissions = ((permResult as any).rows || []).map((row: any) => row.name);

    const sessionData: SessionData = {
      userId: session.user_id,
      email: user.email,
      role: user.role,
      permissions,
      ipAddress: session.ip_address,
      userAgent: session.user_agent,
      createdAt: new Date(),
      expiresAt: new Date(session.expires_at),
    };

    // Cache for future lookups
    await set(cacheKey, sessionData, SESSION_TTL);

    return sessionData;
  } catch (err) {
    logger.error('Error getting session', err);
    return null;
  }
}

/**
 * Delete session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  try {
    // Delete from cache
    const cacheKey = `${SESSION_PREFIX}${sessionId}`;
    await del(cacheKey);

    // Delete from database
    await query('DELETE FROM sessions WHERE token_hash = $1', [sessionId]);

    logger.info('Session deleted', { sessionId });
  } catch (err) {
    logger.error('Error deleting session', err);
    throw err;
  }
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateUserSessions(userId: string): Promise<void> {
  try {
    // Get all sessions for user from database
    const result = await query('SELECT token_hash FROM sessions WHERE user_id = $1', [userId]);

    const sessions = (result as any).rows;

    // Delete from cache
    for (const session of sessions) {
      const cacheKey = `${SESSION_PREFIX}${session.token_hash}`;
      await del(cacheKey);
    }

    // Delete from database
    await query('DELETE FROM sessions WHERE user_id = $1', [userId]);

    logger.info('User sessions invalidated', { userId, count: sessions.length });
  } catch (err) {
    logger.error('Error invalidating user sessions', err);
    throw err;
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    // Delete expired sessions from database
    const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');

    const deletedCount = (result as any).rowCount || 0;

    logger.info('Expired sessions cleaned up', { count: deletedCount });

    return deletedCount;
  } catch (err) {
    logger.error('Error cleaning up expired sessions', err);
    throw err;
  }
}

/**
 * Extend session expiry
 */
export async function extendSession(sessionId: string): Promise<Date | null> {
  try {
    const session = await getSession(sessionId);

    if (!session) {
      return null;
    }

    const expiresAt = new Date(Date.now() + SESSION_TTL * 1000);

    // Update cache
    const cacheKey = `${SESSION_PREFIX}${sessionId}`;
    const updatedSession = { ...session, expiresAt };
    await set(cacheKey, updatedSession, SESSION_TTL);

    // Update database
    await query('UPDATE sessions SET expires_at = $1 WHERE token_hash = $2', [
      expiresAt,
      sessionId,
    ]);

    logger.info('Session extended', { sessionId });

    return expiresAt;
  } catch (err) {
    logger.error('Error extending session', err);
    return null;
  }
}

/**
 * Get session count for user
 */
export async function getUserSessionCount(userId: string): Promise<number> {
  try {
    const result = await query('SELECT COUNT(*) as count FROM sessions WHERE user_id = $1', [
      userId,
    ]);

    return (result as any).rows[0].count;
  } catch (err) {
    logger.error('Error getting user session count', err);
    return 0;
  }
}
