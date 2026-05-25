# API Gateway - Quick Reference

## Base URL
```
http://localhost:3000
```

## Quick Start

### 1. Check System Health
```bash
curl http://localhost:3000/api/health
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 3. Use Token for Authenticated Requests
```bash
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer <token>"
```

## Authentication

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

### Verify Token
```
GET /api/auth/verify
Authorization: Bearer <token>
```

## Services

### List All Services
```
GET /api/services
Authorization: Bearer <token>
```

### Get Service Details
```
GET /api/services/:serviceName
Authorization: Bearer <token>
```

### Check Service Health
```
GET /api/services/:serviceName/health
Authorization: Bearer <token>
```

## Microservices

All microservice endpoints are proxied through the gateway:

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

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Global | 100 | 15 min |
| /api/auth/login | 5 | 15 min |
| API (authenticated) | 60 | 1 min |

## Response Format

### Success
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| INVALID_CREDENTIALS | 401 | Wrong email/password |
| UNAUTHORIZED | 401 | Missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| SERVICE_UNAVAILABLE | 503 | Service down |

## Headers

### Request
```
Authorization: Bearer <token>
Content-Type: application/json
X-Request-ID: <unique-id>
```

### Response
```
X-Request-ID: <unique-id>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T00:15:00Z
```

## Examples

### Complete Login Flow
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }' | jq -r '.data.token')

# 2. Use token
curl -X GET http://localhost:3000/api/services \
  -H "Authorization: Bearer $TOKEN"

# 3. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Check Service Health
```bash
curl -X GET http://localhost:3000/api/services/dashboard/health \
  -H "Authorization: Bearer <token>"
```

### Proxy Request to Microservice
```bash
# This is automatically routed to the dashboard service
curl -X GET http://localhost:3000/api/dashboard/kpis \
  -H "Authorization: Bearer <token>"
```

## Troubleshooting

### 401 Unauthorized
- Check if token is in Authorization header
- Verify token format: `Bearer <token>`
- Login again if token expired

### 403 Forbidden
- Check user role
- Verify required permissions
- Contact admin for access

### 429 Too Many Requests
- Wait for rate limit window to reset
- Check X-RateLimit-Reset header

### 503 Service Unavailable
- Check if microservice is running
- Verify service URL in configuration
- Check network connectivity

## Development

### Start API Gateway
```bash
npm run dev:backend
```

### Build for Production
```bash
npm run build:backend
```

### Run Tests
```bash
npm run test:backend
```

### Lint Code
```bash
npm run lint:backend
```

### Format Code
```bash
npm run format:backend
```

## Configuration

Environment variables in `backend/.env`:

```
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=localhost
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
CORS_ORIGIN=http://localhost:5173
```

## Service URLs

```
DASHBOARD_SERVICE_URL=http://localhost:3101
CLIENTS_SERVICE_URL=http://localhost:3102
SUBSCRIPTIONS_SERVICE_URL=http://localhost:3103
STAFF_SERVICE_URL=http://localhost:3104
DEPARTMENTS_SERVICE_URL=http://localhost:3105
PROJECTS_SERVICE_URL=http://localhost:3106
VAULT_SERVICE_URL=http://localhost:3107
OFFICE_SERVICE_URL=http://localhost:3108
MARKETING_SERVICE_URL=http://localhost:3109
SMS_SERVICE_URL=http://localhost:3110
SUPPORT_SERVICE_URL=http://localhost:3111
FINANCE_SERVICE_URL=http://localhost:3112
SECURITY_SERVICE_URL=http://localhost:3113
DEVELOPER_SERVICE_URL=http://localhost:3114
PRODUCTS_SERVICE_URL=http://localhost:3115
```

## Documentation

- Full API documentation: `backend/API_GATEWAY.md`
- Backend README: `backend/README.md`
- Architecture overview: `ARCHITECTURE.md`

---

**Last Updated**: May 19, 2026
**Version**: 1.0
