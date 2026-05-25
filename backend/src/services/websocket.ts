import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';
import { getSession } from '@/services/session.js';
import { JWTPayload } from '@/types/index.js';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;
const connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds
const socketToUser = new Map<string, string>(); // socketId -> userId

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    return io;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      socket.data.role = decoded.role;
      socket.data.permissions = decoded.permissions;

      next();
    } catch (err) {
      logger.error('WebSocket authentication error', err);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;

    logger.info('WebSocket client connected', { userId, socketId: socket.id });

    // Track user connection
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);
    socketToUser.set(socket.id, userId);

    // Join user room
    socket.join(`user:${userId}`);

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      userId,
      timestamp: new Date(),
    });

    // Handle subscription to channels
    socket.on('subscribe', (data: { channel: string }) => {
      const { channel } = data;

      if (!channel) {
        socket.emit('error', { message: 'Channel name required' });
        return;
      }

      // Validate channel access
      if (channel.startsWith('private:') && !channel.includes(userId)) {
        socket.emit('error', { message: 'Unauthorized channel access' });
        return;
      }

      socket.join(channel);
      logger.debug('User subscribed to channel', { userId, channel, socketId: socket.id });

      socket.emit('subscribed', { channel, timestamp: new Date() });
    });

    // Handle unsubscription from channels
    socket.on('unsubscribe', (data: { channel: string }) => {
      const { channel } = data;

      if (!channel) {
        socket.emit('error', { message: 'Channel name required' });
        return;
      }

      socket.leave(channel);
      logger.debug('User unsubscribed from channel', { userId, channel, socketId: socket.id });

      socket.emit('unsubscribed', { channel, timestamp: new Date() });
    });

    // Handle custom events
    socket.on('message', (data: any) => {
      logger.debug('WebSocket message received', { userId, data });

      // Broadcast to user's room
      io!.to(`user:${userId}`).emit('message', {
        from: userId,
        data,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('WebSocket client disconnected', { userId, socketId: socket.id });

      // Remove user tracking
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
        }
      }
      socketToUser.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error: any) => {
      logger.error('WebSocket error', { userId, socketId: socket.id, error });
    });
  });

  logger.info('WebSocket server initialized');

  return io;
}

/**
 * Get WebSocket server instance
 */
export function getWebSocket(): SocketIOServer {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.');
  }
  return io;
}

/**
 * Broadcast event to specific user
 */
export function broadcastToUser(userId: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }

  io.to(`user:${userId}`).emit(event, {
    data,
    timestamp: new Date(),
  });

  logger.debug('Event broadcasted to user', { userId, event });
}

/**
 * Broadcast event to channel
 */
export function broadcastToChannel(channel: string, event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }

  io.to(channel).emit(event, {
    data,
    timestamp: new Date(),
  });

  logger.debug('Event broadcasted to channel', { channel, event });
}

/**
 * Broadcast event to all connected clients
 */
export function broadcastToAll(event: string, data: any): void {
  if (!io) {
    logger.warn('WebSocket not initialized, cannot broadcast');
    return;
  }

  io.emit(event, {
    data,
    timestamp: new Date(),
  });

  logger.debug('Event broadcasted to all clients', { event });
}

/**
 * Get connected users count
 */
export function getConnectedUsersCount(): number {
  return connectedUsers.size;
}

/**
 * Get user's socket count
 */
export function getUserSocketCount(userId: string): number {
  return connectedUsers.get(userId)?.size || 0;
}

/**
 * Get all connected users
 */
export function getConnectedUsers(): string[] {
  return Array.from(connectedUsers.keys());
}

/**
 * Check if user is connected
 */
export function isUserConnected(userId: string): boolean {
  return connectedUsers.has(userId) && (connectedUsers.get(userId)?.size || 0) > 0;
}

/**
 * Disconnect user
 */
export function disconnectUser(userId: string): void {
  if (!io) {
    return;
  }

  const userSockets = connectedUsers.get(userId);
  if (userSockets) {
    for (const socketId of userSockets) {
      io.to(socketId).emit('disconnected', {
        reason: 'Server initiated disconnect',
        timestamp: new Date(),
      });
      io.sockets.sockets.get(socketId)?.disconnect(true);
    }
  }

  logger.info('User disconnected by server', { userId });
}

/**
 * Get WebSocket statistics
 */
export function getWebSocketStats(): {
  connectedUsers: number;
  totalConnections: number;
  rooms: number;
} {
  if (!io) {
    return { connectedUsers: 0, totalConnections: 0, rooms: 0 };
  }

  let totalConnections = 0;
  for (const sockets of connectedUsers.values()) {
    totalConnections += sockets.size;
  }

  return {
    connectedUsers: connectedUsers.size,
    totalConnections,
    rooms: io.sockets.adapter.rooms.size,
  };
}

/**
 * Close WebSocket server
 */
export async function closeWebSocket(): Promise<void> {
  if (io) {
    await io.close();
    io = null;
    logger.info('WebSocket server closed');
  }
}
