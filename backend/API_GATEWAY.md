# API Gateway Documentation

## Overview

The API Gateway is the central entry point for all client requests to the Javalab Tech HQ System. It handles:

- Request routing to 15 microservices
- Authentication and authorization
- Rate limiting
- Request/response logging
- Error handling
- Service health checks

## Architecture

```
Client Request
    ↓
API Gateway (Port 3000)
    ├─ CORS Check
    ├─ Rate Limit Check
    ├─ Request Logging
    ├─ Auth Validation (if required)
    ├─ Route to Service
    ↓
Microservice (Port 3101-3115)
    ├─ Business Logic
    ├─ Database Query
    ├─ Cache Check/Update
    ├─ Audit Logging
    ↓
Response
    ├─ Format Response
    ├─ Log Request
    ↓
Client Response
```

## Base URL

```
http://localhost:3000
```

## Authentication

### JWT Token

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Getting a Token

1. **Login**
   ```bash
   POST /api/auth/login
   Content-Type: application/json

   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Response**
   ```json
   {
     "success": true,
     "data": {
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "user": {
         "id": "user-id",
         "email": "user@example.com",
         "firstName": "John",
         "lastName": "Doe",
         "role": "admin",
         "status": "active"
       }
     },
     "timestamp": "2024-01-01T00:00:00Z"
   }
   ```

## Rate Limiting

The API Gateway implements three levels of rate limiting:

### Global Rate Limiter
- **Limit**: 100 requests per 15 minutes
- **Applies to**: All requests
- **Key**: Client IP address

### Auth Rate Limiter
- **Limit**: 5 requests per 15 minutes
- **Applies to**: `/api/auth/login`
- **Key**: Client IP + email

### API Rate Limiter
- **Limit**: 60 requests per minute
- **Applies to**: All authenticated API requests
- **Key**: User ID

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T00:15:00Z
```

### Rate Limit Exceeded

When rate limit is exceeded:

```
HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Endpoints

### Health Check

#### Get System Health
```
GET /api/health
```

**Response**
```json
{
  "success": true,
  "data": {
    "apiGateway": {
      "status": "healthy",
      "lastChecked": "2024-01-01T00:00:00Z"
    },
    "database": {
      "status": "healthy",
      "lastChecked": "2024-01-01T00:00:00Z"
    },
    "cache": {
      "status": "healthy",
      "lastChecked": "2024-01-01T00:00:00Z"
    },
    "messageQueue": {
      "status": "healthy",
      "lastChecked": "2024-01-01T00:00:00Z"
    },
    "elasticsearch": {
      "status": "healthy",
      "lastChecked": "2024-01-01T00:00:00Z"
    },
    "timestamp": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Authentication

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "admin",
      "status": "active",
      "twoFaEnabled": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Errors**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - User account is inactive
- `429 Too Many Requests` - Rate limit exceeded

#### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response** (200 OK)
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <token>
```

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "valid": true,
    "userId": "user-id",
    "role": "admin"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Services

#### Get All Services
```
GET /api/services
Authorization: Bearer <token>
```

**Required Role**: admin

**Response** (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "name": "dashboard",
      "baseUrl": "http://localhost:3101",
      "routes": ["/api/dashboard/*"],
      "healthCheck": "/health"
    },
    {
      "name": "clients",
      "baseUrl": "http://localhost:3102",
      "routes": ["/api/clients/*"],
      "healthCheck": "/health"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Service Details
```
GET /api/services/:serviceName
Authorization: Bearer <token>
```

**Required Role**: admin

**Parameters**
- `serviceName` (string, required) - Service name (e.g., "dashboard", "clients")

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "name": "dashboard",
    "baseUrl": "http://localhost:3101",
    "routes": ["/api/dashboard/*"],
    "healthCheck": "/health"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Check Service Health
```
GET /api/services/:serviceName/health
Authorization: Bearer <token>
```

**Parameters**
- `serviceName` (string, required) - Service name

**Response** (200 OK)
```json
{
  "success": true,
  "data": {
    "service": "dashboard",
    "status": "healthy",
    "details": {
      "apiGateway": {
        "status": "healthy",
        "lastChecked": "2024-01-01T00:00:00Z"
      }
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Microservice Routes

All microservice routes are proxied through the API Gateway:

```
GET    /api/dashboard/*
GET    /api/clients/*
GET    /api/subscriptions/*
GET    /api/staff/*
GET    /api/departments/*
GET    /api/projects/*
GET    /api/vault/*
GET    /api/office/*
GET    /api/marketing/*
GET    /api/sms/*
GET    /api/support/*
GET    /api/finance/*
GET    /api/security/*
GET    /api/developer/*
GET    /api/products/*
```

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| INVALID_INPUT | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Authentication required |
| INVALID_CREDENTIALS | 401 | Invalid email or password |
| FORBIDDEN | 403 | Insufficient permissions |
| USER_INACTIVE | 403 | User account is inactive |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SERVICE_UNAVAILABLE | 503 | Service is not available |
| SERVICE_UNHEALTHY | 503 | Service is unhealthy |
| PROXY_ERROR | 502 | Error forwarding request |
| INTERNAL_ERROR | 500 | Internal server error |

## Request Headers

### Standard Headers

```
Content-Type: application/json
Authorization: Bearer <token>
X-Request-ID: <request-id>
```

### Custom Headers

| Header | Description |
|--------|-------------|
| X-Request-ID | Unique request identifier for tracing |
| X-Forwarded-For | Client IP address |
| X-Forwarded-Proto | Original protocol (http/https) |

## Response Headers

| Header | Description |
|--------|-------------|
| X-Request-ID | Unique request identifier |
| X-RateLimit-Limit | Rate limit maximum |
| X-RateLimit-Remaining | Remaining requests |
| X-RateLimit-Reset | Rate limit reset time |
| Content-Type | Response content type |

## Examples

### Login and Make Authenticated Request

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#     "user": { ... }
#   }
# }

# 2. Use token for authenticated request
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Check Service Health

```bash
curl -X GET http://localhost:3000/api/services/dashboard/health \
  -H "Authorization: Bearer <token>"
```

### Proxy Request to Microservice

```bash
# This request is automatically proxied to the dashboard service
curl -X GET http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer <token>"
```

## Middleware Stack

The API Gateway applies middleware in the following order:

1. **CORS** - Cross-Origin Resource Sharing
2. **JSON Parser** - Parse JSON request bodies
3. **URL Encoded Parser** - Parse form-encoded bodies
4. **Global Rate Limiter** - Rate limiting by IP
5. **Request Logger** - Log all requests
6. **Optional Auth** - Extract JWT token if present
7. **Route Handlers** - Process specific routes
8. **Proxy Middleware** - Forward to microservices
9. **404 Handler** - Handle not found
10. **Error Handler** - Handle errors

## Performance

### Response Times

- **Health Check**: < 100ms
- **Login**: < 500ms
- **Proxy Request**: < 1s (depends on microservice)
- **Service Health Check**: < 5s

### Caching

- **Token Cache**: 24 hours
- **Service Registry**: In-memory (no expiry)
- **Rate Limit Cache**: 15 minutes

## Security

### Authentication
- JWT tokens with configurable expiry
- Token validation on protected routes
- Token blacklisting on logout

### Authorization
- Role-based access control (RBAC)
- Permission-based access control
- Record-level access control (future)

### Rate Limiting
- Global rate limiting by IP
- Auth rate limiting by IP + email
- API rate limiting by user ID

### Input Validation
- JSON schema validation (future)
- SQL injection prevention
- XSS protection

## Troubleshooting

### 401 Unauthorized

**Cause**: Missing or invalid token

**Solution**:
1. Check if token is included in Authorization header
2. Verify token format: `Bearer <token>`
3. Check if token has expired
4. Login again to get a new token

### 403 Forbidden

**Cause**: Insufficient permissions or role

**Solution**:
1. Check user role
2. Verify required permissions
3. Contact administrator to grant permissions

### 429 Too Many Requests

**Cause**: Rate limit exceeded

**Solution**:
1. Wait for rate limit window to reset
2. Check X-RateLimit-Reset header for reset time
3. Reduce request frequency

### 503 Service Unavailable

**Cause**: Microservice is down or unreachable

**Solution**:
1. Check if microservice is running
2. Verify service URL in configuration
3. Check network connectivity
4. Review service logs

## Development

### Adding a New Microservice

1. Update `backend/src/services/gateway.ts` - Add service to registry
2. Update `backend/.env.example` - Add service URL
3. Update `backend/.env` - Set service URL
4. Restart API Gateway

### Testing

```bash
# Test health check
curl http://localhost:3000/api/health

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test"}'

# Test services endpoint
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer <token>"
```

---

**API Gateway Version**: 1.0
**Last Updated**: May 19, 2026
**Status**: Production Ready
