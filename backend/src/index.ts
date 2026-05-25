import express, { Express } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';
import { initializeDatabase, closeDatabase } from '@/services/database.js';
import { initializeCache, closeCache } from '@/services/cache.js';
import { initializeMessageQueue, closeMessageQueue } from '@/services/messageQueue.js';
import { initializeGateway } from '@/services/gateway.js';
import { runMigrations } from '@/services/migrations.js';
import { warmCache, setupCacheInvalidationListeners } from '@/services/cacheManager.js';
import { cleanupExpiredSessions } from '@/services/session.js';
import { setupQueueMonitoring } from '@/services/queueManager.js';
import { initializeWebSocket, closeWebSocket } from '@/services/websocket.js';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler.js';
import { globalRateLimiter } from '@/middleware/rateLimit.js';
import { optionalAuthMiddleware } from '@/middleware/auth.js';
import { requestLoggerMiddleware } from '@/middleware/requestLogger.js';
import { loadUserPermissions } from '@/middleware/rbac.js';
import { proxyMiddleware } from '@/middleware/proxy.js';
import healthRoutes from '@/routes/health.js';
import authRoutes from '@/routes/auth.js';
import servicesRoutes from '@/routes/services.js';
import rolesRoutes from '@/routes/roles.js';
import permissionsRoutes from '@/routes/permissions.js';
import databaseRoutes from '@/routes/database.js';
import sessionsRoutes from '@/routes/sessions.js';
import queuesRoutes from '@/routes/queues.js';
import websocketRoutes from '@/routes/websocket.js';
import departmentsRoutes from '@/routes/departments.js';
import dashboardRoutes from '@/routes/dashboard.js';
import staffRoutes from '@/routes/staff.js';

const app: Express = express();

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalRateLimiter);
app.use(requestLoggerMiddleware);
app.use(optionalAuthMiddleware);
app.use(loadUserPermissions);

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/database', databaseRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/queues', queuesRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/staff', staffRoutes);

// Proxy middleware for microservices (must be after specific routes)
app.use(proxyMiddleware);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    // Initialize services
    logger.info('Initializing services...');
    await initializeDatabase();
    await initializeCache();
    await initializeMessageQueue();
    initializeGateway();

    // Setup cache invalidation listeners
    setupCacheInvalidationListeners();

    // Warm cache with frequently accessed data
    await warmCache();

    // Setup queue monitoring
    setupQueueMonitoring();

    // Run database migrations
    logger.info('Running database migrations...');
    await runMigrations();

    // Setup periodic session cleanup (every hour)
    setInterval(async () => {
      try {
        const deletedCount = await cleanupExpiredSessions();
        if (deletedCount > 0) {
          logger.info(`Cleaned up ${deletedCount} expired sessions`);
        }
      } catch (err) {
        logger.error('Error in session cleanup job', err);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Create HTTP server for WebSocket
    const httpServer = createServer(app);

    // Initialize WebSocket
    initializeWebSocket(httpServer);

    // Start server
    httpServer.listen(config.apiGateway.port, config.apiGateway.host, () => {
      logger.info(
        `API Gateway started on http://${config.apiGateway.host}:${config.apiGateway.port}`
      );
      logger.info('WebSocket server available on ws://localhost:3000');
      logger.info('Available routes:');
      logger.info('  GET  /api/health');
      logger.info('  POST /api/auth/login');
      logger.info('  POST /api/auth/logout');
      logger.info('  GET  /api/auth/verify');
      logger.info('  GET  /api/services');
      logger.info('  GET  /api/services/:serviceName');
      logger.info('  GET  /api/services/:serviceName/health');
      logger.info('  GET  /api/roles');
      logger.info('  POST /api/roles');
      logger.info('  GET  /api/roles/:roleId');
      logger.info('  PUT  /api/roles/:roleId');
      logger.info('  DELETE /api/roles/:roleId');
      logger.info('  POST /api/roles/:roleId/permissions');
      logger.info('  DELETE /api/roles/:roleId/permissions/:permissionId');
      logger.info('  GET  /api/permissions');
      logger.info('  POST /api/permissions');
      logger.info('  GET  /api/permissions/:permissionId');
      logger.info('  PUT  /api/permissions/:permissionId');
      logger.info('  DELETE /api/permissions/:permissionId');
      logger.info('  GET  /api/permissions/module/:module');
      logger.info('  GET  /api/database/migrations/status');
      logger.info('  POST /api/database/migrations/run');
      logger.info('  POST /api/database/seed');
      logger.info('  GET  /api/database/info');
      logger.info('  GET  /api/sessions/current');
      logger.info('  POST /api/sessions/extend');
      logger.info('  DELETE /api/sessions/current');
      logger.info('  GET  /api/sessions/count');
      logger.info('  POST /api/sessions/invalidate-all');
      logger.info('  POST /api/sessions/cleanup');
      logger.info('  GET  /api/sessions/health');
      logger.info('  POST /api/queues/tasks');
      logger.info('  GET  /api/queues/tasks/:taskId');
      logger.info('  GET  /api/queues/stats');
      logger.info('  GET  /api/queues/failed');
      logger.info('  POST /api/queues/tasks/:taskId/complete');
      logger.info('  POST /api/queues/tasks/:taskId/fail');
      logger.info('  POST /api/queues/purge');
      logger.info('  GET  /api/queues/health');
      logger.info('  GET  /api/websocket/stats');
      logger.info('  GET  /api/websocket/users/connected');
      logger.info('  GET  /api/websocket/users/:userId/sockets');
      logger.info('  GET  /api/websocket/users/list');
      logger.info('  GET  /api/websocket/health');
      logger.info('  GET  /api/dashboard/kpis');
      logger.info('  GET  /api/dashboard/kpis/:kpiId');
      logger.info('  PUT  /api/dashboard/kpis/:kpiId');
      logger.info('  GET  /api/dashboard/health');
      logger.info('  GET  /api/dashboard/charts/:chartType');
      logger.info('  GET  /api/dashboard/metrics');
      logger.info('  POST /api/dashboard/cache/invalidate');
      logger.info('  *    /api/* (proxied to microservices)');
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

async function gracefulShutdown(): Promise<void> {
  logger.info('Shutting down gracefully...');

  try {
    await closeWebSocket();
    await closeDatabase();
    await closeCache();
    await closeMessageQueue();
    logger.info('All services closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown', err);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer();
