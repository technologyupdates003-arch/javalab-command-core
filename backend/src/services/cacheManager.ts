import { invalidatePattern, get, set } from '@/services/cache.js';
import logger from '@/utils/logger.js';

/**
 * Cache Manager Service
 * Handles cache invalidation strategies, cache warming, and cache lifecycle management
 */

// Cache key patterns for different entities
export const CACHE_PATTERNS = {
  USER: 'user:*',
  ROLE: 'role:*',
  PERMISSION: 'permission:*',
  SESSION: 'session:*',
  MODULE: 'module:*',
  RBAC: 'rbac:*',
  GATEWAY: 'gateway:*',
};

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 24 * 60 * 60, // 24 hours
  VERY_LONG: 7 * 24 * 60 * 60, // 7 days
};

/**
 * Invalidate cache by pattern
 * Useful for clearing related cache entries
 */
export async function invalidateCachePattern(pattern: string): Promise<void> {
  try {
    await invalidatePattern(pattern);
    logger.info('Cache pattern invalidated', { pattern });
  } catch (err) {
    logger.error('Error invalidating cache pattern', { pattern, error: err });
    throw err;
  }
}

/**
 * Invalidate all user-related cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await invalidatePattern(`user:${userId}:*`);
    await invalidatePattern(`rbac:user:${userId}:*`);
    logger.info('User cache invalidated', { userId });
  } catch (err) {
    logger.error('Error invalidating user cache', { userId, error: err });
    throw err;
  }
}

/**
 * Invalidate all role-related cache
 */
export async function invalidateRoleCache(roleId: string): Promise<void> {
  try {
    await invalidatePattern(`role:${roleId}:*`);
    await invalidatePattern(`rbac:role:${roleId}:*`);
    logger.info('Role cache invalidated', { roleId });
  } catch (err) {
    logger.error('Error invalidating role cache', { roleId, error: err });
    throw err;
  }
}

/**
 * Invalidate all permission-related cache
 */
export async function invalidatePermissionCache(permissionId: string): Promise<void> {
  try {
    await invalidatePattern(`permission:${permissionId}:*`);
    await invalidatePattern(`rbac:permission:${permissionId}:*`);
    logger.info('Permission cache invalidated', { permissionId });
  } catch (err) {
    logger.error('Error invalidating permission cache', { permissionId, error: err });
    throw err;
  }
}

/**
 * Invalidate all RBAC-related cache
 * Called when permissions or roles change
 */
export async function invalidateRBACCache(): Promise<void> {
  try {
    await invalidatePattern(CACHE_PATTERNS.RBAC);
    logger.info('RBAC cache invalidated');
  } catch (err) {
    logger.error('Error invalidating RBAC cache', err);
    throw err;
  }
}

/**
 * Invalidate all gateway-related cache
 * Called when service registry changes
 */
export async function invalidateGatewayCache(): Promise<void> {
  try {
    await invalidatePattern(CACHE_PATTERNS.GATEWAY);
    logger.info('Gateway cache invalidated');
  } catch (err) {
    logger.error('Error invalidating gateway cache', err);
    throw err;
  }
}

/**
 * Warm cache with frequently accessed data
 * Called on server startup
 */
export async function warmCache(): Promise<void> {
  try {
    logger.info('Starting cache warming...');

    // Warm up gateway service registry
    const gatewayKey = 'gateway:services:registry';
    const registry = {
      services: [
        { name: 'dashboard', port: 3101, health: '/health' },
        { name: 'clients', port: 3102, health: '/health' },
        { name: 'subscriptions', port: 3103, health: '/health' },
        { name: 'staff', port: 3104, health: '/health' },
        { name: 'departments', port: 3105, health: '/health' },
        { name: 'projects', port: 3106, health: '/health' },
        { name: 'vault', port: 3107, health: '/health' },
        { name: 'security', port: 3108, health: '/health' },
        { name: 'office', port: 3109, health: '/health' },
        { name: 'support', port: 3110, health: '/health' },
        { name: 'marketing', port: 3111, health: '/health' },
        { name: 'sms', port: 3112, health: '/health' },
        { name: 'finance', port: 3113, health: '/health' },
        { name: 'developer', port: 3114, health: '/health' },
        { name: 'products', port: 3115, health: '/health' },
      ],
    };

    await set(gatewayKey, registry, CACHE_TTL.LONG);
    logger.info('Gateway service registry cached');

    logger.info('Cache warming completed');
  } catch (err) {
    logger.error('Error warming cache', err);
    // Don't throw - cache warming is not critical for startup
  }
}

/**
 * Get cache statistics
 * Returns information about cache usage
 */
export async function getCacheStats(): Promise<{
  timestamp: Date;
  status: string;
}> {
  try {
    return {
      timestamp: new Date(),
      status: 'operational',
    };
  } catch (err) {
    logger.error('Error getting cache stats', err);
    throw err;
  }
}

/**
 * Clear all cache
 * Use with caution - only for maintenance or testing
 */
export async function clearAllCache(): Promise<void> {
  try {
    // Clear all patterns
    const patterns = Object.values(CACHE_PATTERNS);
    for (const pattern of patterns) {
      await invalidatePattern(pattern);
    }
    logger.warn('All cache cleared');
  } catch (err) {
    logger.error('Error clearing all cache', err);
    throw err;
  }
}

/**
 * Setup cache invalidation event listeners
 * Called during service initialization
 */
export function setupCacheInvalidationListeners(): void {
  logger.info('Cache invalidation listeners setup');
  // This would be connected to event emitters from other services
  // For now, it's a placeholder for future event-driven cache invalidation
}
