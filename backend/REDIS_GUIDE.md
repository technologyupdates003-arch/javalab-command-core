# Redis Configuration and Caching Strategy Guide

## Overview

Redis is used in the Javalab Tech HQ system for:
- **Session Management**: Storing user session data with 24-hour TTL
- **Caching**: Reducing database load for frequently accessed data
- **Rate Limiting**: Tracking request counts per user/IP
- **Message Queue**: Temporary storage for async task processing
- **Real-time Updates**: Pub/Sub for WebSocket event distribution

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (3000)                       │
├─────────────────────────────────────────────────────────────┤
│  ├─ Session Management                                      │
│  ├─ Rate Limiting                                           │
│  ├─ Cache Layer                                             │
│  └─ Request Logging                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Redis (6379)   │
        ├─────────────────┤
        │ ├─ Sessions     │
        │ ├─ Cache        │
        │ ├─ Rate Limits  │
        │ ├─ Queues      │
        │ └─ Pub/Sub      │
        └─────────────────┘
```

## Configuration

### Environment Variables

```bash
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=          # Optional, leave empty if no auth
REDIS_TLS=false          # Enable TLS for production

# Cache Settings
CACHE_TTL_SHORT=300      # 5 minutes
CACHE_TTL_MEDIUM=1800    # 30 minutes
CACHE_TTL_LONG=86400     # 24 hours

# Session Settings
SESSION_TTL=86400        # 24 hours
SESSION_CLEANUP_INTERVAL=3600  # 1 hour
```

### Docker Compose Configuration

```yaml
redis:
  image: redis:7-alpine
  container_name: javalab-redis
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --requirepass ""
  environment:
    - REDIS_REPLICATION_BACKLOG_SIZE=1mb
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - javalab-network
```

## Cache Key Patterns

### Session Keys
```
session:{sessionId}
  - Stores: SessionData (userId, email, role, permissions, ipAddress, userAgent, createdAt, expiresAt)
  - TTL: 24 hours
  - Example: session:550e8400-e29b-41d4-a716-446655440000
```

### User Cache Keys
```
user:{userId}:profile
  - Stores: User profile information
  - TTL: 30 minutes
  - Example: user:123:profile

user:{userId}:permissions
  - Stores: User permissions array
  - TTL: 30 minutes
  - Example: user:123:permissions

user:{userId}:roles
  - Stores: User roles array
  - TTL: 30 minutes
  - Example: user:123:roles
```

### Role Cache Keys
```
role:{roleId}:permissions
  - Stores: Permissions for a role
  - TTL: 1 hour
  - Example: role:admin:permissions

role:{roleId}:users
  - Stores: Users with this role
  - TTL: 1 hour
  - Example: role:admin:users
```

### Permission Cache Keys
```
permission:{permissionId}:details
  - Stores: Permission details
  - TTL: 1 hour
  - Example: permission:user:create:details

permission:module:{module}
  - Stores: All permissions for a module
  - TTL: 1 hour
  - Example: permission:module:users
```

### RBAC Cache Keys
```
rbac:user:{userId}:permissions
  - Stores: Computed permissions for a user
  - TTL: 30 minutes
  - Example: rbac:user:123:permissions

rbac:role:{roleId}:permissions
  - Stores: Computed permissions for a role
  - TTL: 1 hour
  - Example: rbac:role:admin:permissions
```

### Gateway Cache Keys
```
gateway:services:registry
  - Stores: Service registry with all microservices
  - TTL: 24 hours
  - Example: gateway:services:registry

gateway:service:{serviceName}:health
  - Stores: Service health status
  - TTL: 5 minutes
  - Example: gateway:service:dashboard:health
```

### Rate Limit Keys
```
ratelimit:global:{timestamp}
  - Stores: Global request count
  - TTL: 1 minute
  - Example: ratelimit:global:1234567890

ratelimit:user:{userId}:{timestamp}
  - Stores: Per-user request count
  - TTL: 1 minute
  - Example: ratelimit:user:123:1234567890

ratelimit:ip:{ipAddress}:{timestamp}
  - Stores: Per-IP request count
  - TTL: 1 minute
  - Example: ratelimit:ip:192.168.1.1:1234567890
```

## Cache Invalidation Strategy

### Automatic Invalidation

1. **TTL-based**: All cache entries have TTL and expire automatically
2. **Event-based**: Cache is invalidated when data changes
3. **Pattern-based**: Related cache entries invalidated together

### Manual Invalidation

```typescript
// Invalidate specific user cache
await invalidateUserCache(userId);

// Invalidate specific role cache
await invalidateRoleCache(roleId);

// Invalidate all RBAC cache
await invalidateRBACCache();

// Invalidate by pattern
await invalidateCachePattern('user:*');
```

### Invalidation Triggers

| Event | Cache Invalidated | TTL |
|-------|------------------|-----|
| User created | user:{userId}:* | - |
| User updated | user:{userId}:* | - |
| User deleted | user:{userId}:* | - |
| Role created | role:{roleId}:* | - |
| Role updated | role:{roleId}:*, rbac:* | - |
| Permission created | permission:*, rbac:* | - |
| Permission updated | permission:*, rbac:* | - |
| Permission deleted | permission:*, rbac:* | - |
| Role-Permission assigned | rbac:* | - |
| Role-Permission removed | rbac:* | - |

## Cache Warming

Cache warming occurs on server startup to pre-load frequently accessed data:

```typescript
// Warm gateway service registry
gateway:services:registry = {
  services: [
    { name: 'dashboard', port: 3101, health: '/health' },
    { name: 'clients', port: 3102, health: '/health' },
    // ... 15 services total
  ]
}
```

### Benefits
- Reduces initial latency for first requests
- Ensures service registry is available immediately
- Improves user experience on startup

## Session Management

### Session Lifecycle

```
1. User Login
   ├─ Create session in Redis (24h TTL)
   ├─ Store in PostgreSQL database
   └─ Return sessionId to client

2. Session Active
   ├─ Client sends sessionId in headers
   ├─ Check Redis cache first (fast)
   ├─ Fall back to database if not cached
   └─ Extend TTL on each request

3. Session Expiry
   ├─ Automatic expiry after 24 hours
   ├─ Periodic cleanup job removes expired sessions
   └─ User must login again

4. Session Invalidation
   ├─ User logout: delete session
   ├─ Password change: invalidate all user sessions
   ├─ Permission change: invalidate affected sessions
   └─ Admin action: invalidate specific sessions
```

### Session Data Structure

```typescript
interface SessionData {
  userId: string;           // User ID
  email: string;            // User email
  role: string;             // User role
  permissions: string[];    // User permissions
  ipAddress: string;        // Client IP address
  userAgent: string;        // Client user agent
  createdAt: Date;          // Session creation time
  expiresAt: Date;          // Session expiration time
}
```

### Session Endpoints

```
GET    /api/sessions/current           - Get current session info
POST   /api/sessions/extend            - Extend session expiry
DELETE /api/sessions/current           - Delete current session (logout)
GET    /api/sessions/count             - Get session count for user
POST   /api/sessions/invalidate-all    - Invalidate all user sessions
POST   /api/sessions/cleanup           - Cleanup expired sessions (admin)
GET    /api/sessions/health            - Check session service health
```

## Rate Limiting with Redis

### Rate Limit Levels

1. **Global Rate Limit**: 1000 requests/minute across all users
2. **Per-User Rate Limit**: 100 requests/minute per user
3. **Per-IP Rate Limit**: 500 requests/minute per IP address

### Implementation

```typescript
// Check rate limits
const globalCount = await get(`ratelimit:global:${minute}`);
const userCount = await get(`ratelimit:user:${userId}:${minute}`);
const ipCount = await get(`ratelimit:ip:${ipAddress}:${minute}`);

// Increment counters
await incr(`ratelimit:global:${minute}`);
await incr(`ratelimit:user:${userId}:${minute}`);
await incr(`ratelimit:ip:${ipAddress}:${minute}`);

// Set expiry (1 minute)
await expire(`ratelimit:global:${minute}`, 60);
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check Redis connection
redis-cli ping
# Expected: PONG

# Check memory usage
redis-cli info memory
# Look for: used_memory_human

# Check connected clients
redis-cli info clients
# Look for: connected_clients

# Check key count
redis-cli dbsize
# Returns: number of keys
```

### Performance Metrics

```bash
# Get Redis stats
redis-cli info stats

# Monitor commands in real-time
redis-cli monitor

# Get slowlog
redis-cli slowlog get 10
```

### Cleanup Tasks

#### Periodic Session Cleanup

```typescript
// Runs every hour
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await query('DELETE FROM sessions WHERE expires_at < NOW()');
  return result.rowCount;
}
```

#### Cache Invalidation on Updates

```typescript
// When user is updated
await invalidateUserCache(userId);

// When role is updated
await invalidateRoleCache(roleId);

// When permissions change
await invalidateRBACCache();
```

## Best Practices

### 1. Key Naming Convention
- Use colons as separators: `entity:id:property`
- Use lowercase for consistency
- Include version if needed: `v1:user:123:profile`

### 2. TTL Strategy
- Short-lived data (5 min): Rate limits, temporary tokens
- Medium-lived data (30 min): User profiles, permissions
- Long-lived data (24 hours): Sessions, service registry
- Very long-lived (7 days): Rarely changing reference data

### 3. Cache Invalidation
- Invalidate on write, not on read
- Use pattern-based invalidation for related data
- Implement event-driven invalidation for consistency
- Always have a fallback to database

### 4. Memory Management
- Monitor memory usage regularly
- Set maxmemory policy: `allkeys-lru` (evict least recently used)
- Use appropriate TTLs to prevent memory bloat
- Archive old data to database

### 5. Security
- Use strong passwords for Redis authentication
- Enable TLS for production environments
- Restrict network access to Redis
- Use separate Redis instances for different environments
- Rotate credentials regularly

### 6. High Availability
- Use Redis Sentinel for automatic failover
- Implement Redis Cluster for horizontal scaling
- Enable persistence (AOF) for data durability
- Regular backups to external storage

## Troubleshooting

### Issue: Redis Connection Timeout

```bash
# Check if Redis is running
redis-cli ping

# Check network connectivity
telnet localhost 6379

# Check Redis logs
docker logs javalab-redis
```

### Issue: High Memory Usage

```bash
# Check memory stats
redis-cli info memory

# Find large keys
redis-cli --bigkeys

# Clear specific pattern
redis-cli KEYS "pattern:*" | xargs redis-cli DEL
```

### Issue: Slow Performance

```bash
# Check slowlog
redis-cli slowlog get 10

# Monitor commands
redis-cli monitor

# Check key count
redis-cli dbsize

# Analyze memory fragmentation
redis-cli info memory | grep fragmentation
```

### Issue: Session Not Found

```bash
# Check if session exists
redis-cli GET session:{sessionId}

# Check session in database
SELECT * FROM sessions WHERE token_hash = '{sessionId}';

# Check session expiry
redis-cli TTL session:{sessionId}
```

## Production Deployment

### Docker Compose for Production

```yaml
redis:
  image: redis:7-alpine
  container_name: javalab-redis-prod
  ports:
    - "127.0.0.1:6379:6379"  # Only localhost
  volumes:
    - redis_data:/data
    - ./redis.conf:/usr/local/etc/redis/redis.conf
  command: redis-server /usr/local/etc/redis/redis.conf
  environment:
    - REDIS_REPLICATION_BACKLOG_SIZE=10mb
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  restart: unless-stopped
  networks:
    - javalab-network
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### Redis Configuration (redis.conf)

```conf
# Network
bind 127.0.0.1
port 6379
timeout 0
tcp-backlog 511

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Logging
loglevel notice
logfile ""

# Security
requirepass your-strong-password-here

# Replication
replica-read-only yes
```

## References

- [Redis Documentation](https://redis.io/documentation)
- [Redis Commands](https://redis.io/commands)
- [Redis Best Practices](https://redis.io/topics/best-practices)
- [Redis Persistence](https://redis.io/topics/persistence)
- [Redis Replication](https://redis.io/topics/replication)
