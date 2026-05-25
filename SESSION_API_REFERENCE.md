# Session Management API Reference

## Overview

The Session Management API provides endpoints for managing user sessions, including creation, retrieval, extension, and invalidation. Sessions are stored in both Redis (for fast access) and PostgreSQL (for persistence).

## Base URL

```
http://localhost:3000/api/sessions
```

## Authentication

All endpoints (except health check) require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Current Session

**Endpoint**: `GET /api/sessions/current`

**Description**: Retrieve information about the current user's session.

**Headers**:
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response** (200 OK):
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-123",
  "email": "user@example.com",
  "role": "admin",
  "permissions": ["user:read", "user:write", "role:manage"],
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "createdAt": "2024-05-19T10:30:00Z",
  "expiresAt": "2024-05-20T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Session ID not found in headers
- `404 Not Found` - Session not found or expired
- `500 Internal Server Error` - Server error

---

### 2. Extend Session

**Endpoint**: `POST /api/sessions/extend`

**Description**: Extend the current session's expiry time by 24 hours.

**Headers**:
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response** (200 OK):
```json
{
  "message": "Session extended",
  "expiresAt": "2024-05-21T10:30:00Z"
}
```

**Error Responses**:
- `400 Bad Request` - Session ID not found
- `404 Not Found` - Session not found or expired
- `500 Internal Server Error` - Server error

---

### 3. Delete Current Session (Logout)

**Endpoint**: `DELETE /api/sessions/current`

**Description**: Delete the current session (logout the user).

**Headers**:
```
Authorization: Bearer <jwt_token>
X-Session-ID: <session_id>
```

**Response** (200 OK):
```json
{
  "message": "Session deleted successfully"
}
```

**Error Responses**:
- `400 Bad Request` - Session ID not found
- `500 Internal Server Error` - Server error

---

### 4. Get Session Count

**Endpoint**: `GET /api/sessions/count`

**Description**: Get the number of active sessions for the current user.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "userId": "user-123",
  "sessionCount": 3
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error

---

### 5. Invalidate All User Sessions

**Endpoint**: `POST /api/sessions/invalidate-all`

**Description**: Invalidate all sessions for the current user. Requires `session:invalidate` permission.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "All user sessions invalidated",
  "userId": "user-123"
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 6. Cleanup Expired Sessions

**Endpoint**: `POST /api/sessions/cleanup`

**Description**: Remove all expired sessions from the database. Requires `session:cleanup` permission (admin only).

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "message": "Expired sessions cleaned up",
  "deletedCount": 42
}
```

**Error Responses**:
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Insufficient permissions (admin only)
- `500 Internal Server Error` - Server error

---

### 7. Session Service Health Check

**Endpoint**: `GET /api/sessions/health`

**Description**: Check the health status of the session service. No authentication required.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "sessions",
  "timestamp": "2024-05-19T10:30:00Z"
}
```

**Error Responses**:
- `500 Internal Server Error` - Service unhealthy

---

## Session Data Structure

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

## Session Storage

### Redis Storage
- **Key Pattern**: `session:{sessionId}`
- **TTL**: 24 hours
- **Purpose**: Fast session lookup
- **Fallback**: Database if not found in cache

### PostgreSQL Storage
- **Table**: `sessions`
- **Columns**: `user_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`
- **Purpose**: Persistent session storage
- **Cleanup**: Automatic removal of expired sessions every hour

## Session Lifecycle

### Creation
1. User logs in via `/api/auth/login`
2. Session created in Redis with 24-hour TTL
3. Session stored in PostgreSQL database
4. Session ID returned to client

### Usage
1. Client includes session ID in `X-Session-ID` header
2. API checks Redis cache first (fast)
3. Falls back to database if not cached
4. Session TTL extended on each request

### Expiration
1. Automatic expiry after 24 hours
2. Periodic cleanup job removes expired sessions
3. User must login again to create new session

### Invalidation
1. User logout: Session deleted immediately
2. Password change: All user sessions invalidated
3. Permission change: Affected sessions invalidated
4. Admin action: Specific sessions invalidated

## Rate Limiting

Session endpoints are subject to rate limiting:
- **Global**: 1000 requests/minute
- **Per-User**: 100 requests/minute
- **Per-IP**: 500 requests/minute

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "timestamp": "2024-05-19T10:30:00Z"
}
```

## Examples

### Example 1: Get Current Session

```bash
curl -X GET http://localhost:3000/api/sessions/current \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Session-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### Example 2: Extend Session

```bash
curl -X POST http://localhost:3000/api/sessions/extend \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Session-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### Example 3: Logout

```bash
curl -X DELETE http://localhost:3000/api/sessions/current \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "X-Session-ID: 550e8400-e29b-41d4-a716-446655440000"
```

### Example 4: Check Health

```bash
curl -X GET http://localhost:3000/api/sessions/health
```

## Best Practices

1. **Always include Session ID**: Include `X-Session-ID` header in all session-related requests
2. **Extend Sessions**: Call extend endpoint periodically to keep sessions active
3. **Logout on Exit**: Always logout when user closes the application
4. **Handle Expiration**: Implement client-side logic to handle session expiration
5. **Monitor Sessions**: Use count endpoint to monitor active sessions
6. **Cleanup**: Run cleanup endpoint periodically to remove expired sessions

## Permissions

| Endpoint | Permission | Role |
|----------|-----------|------|
| GET /current | None | Authenticated |
| POST /extend | None | Authenticated |
| DELETE /current | None | Authenticated |
| GET /count | None | Authenticated |
| POST /invalidate-all | session:invalidate | User/Admin |
| POST /cleanup | session:cleanup | Admin |
| GET /health | None | Public |

## Related Documentation

- [Redis Configuration Guide](./REDIS_GUIDE.md)
- [Authentication Guide](./backend/README.md)
- [API Gateway Documentation](./backend/API_GATEWAY.md)
- [RBAC Guide](./backend/RBAC_GUIDE.md)
