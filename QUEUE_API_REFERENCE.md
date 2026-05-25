# Queue Management API Reference

## Overview

The Queue Management API provides endpoints for managing asynchronous tasks, including queuing, tracking, and managing retries. Tasks are processed by RabbitMQ with exponential backoff retry logic.

## Base URL

```
http://localhost:3000/api/queues
```

## Authentication

All endpoints require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Queue a Task

**Endpoint**: `POST /api/queues/tasks`

**Description**: Queue a new asynchronous task for processing.

**Request Body**:
```json
{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "template": "welcome"
  },
  "priority": "normal",
  "maxRetries": 3
}
```

**Parameters**:
- `type` (string, required): Task type (email, sms, notification, report, billing, payroll)
- `payload` (object, required): Task data
- `priority` (string, optional): Task priority (low, normal, high). Default: normal
- `maxRetries` (number, optional): Maximum retry attempts. Default: 3

**Response** (201 Created):
```json
{
  "message": "Task queued successfully",
  "taskId": "task-1234567890-abc123",
  "type": "email",
  "priority": "normal"
}
```

**Error Responses**:
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

---

### 2. Get Task Status

**Endpoint**: `GET /api/queues/tasks/:taskId`

**Description**: Retrieve the status and details of a queued task.

**Parameters**:
- `taskId` (string, required): Task ID from queue response

**Response** (200 OK):
```json
{
  "taskId": "task-1234567890-abc123",
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "template": "welcome"
  },
  "priority": "normal",
  "status": "completed",
  "retries": 0,
  "maxRetries": 3,
  "createdAt": "2024-05-19T10:30:00Z",
  "processedAt": "2024-05-19T10:30:05Z"
}
```

**Status Values**:
- `pending` - Task is waiting to be processed
- `processing` - Task is currently being processed
- `completed` - Task completed successfully
- `failed` - Task failed after max retries

**Error Responses**:
- `404 Not Found` - Task not found
- `500 Internal Server Error` - Server error

---

### 3. Get Queue Statistics

**Endpoint**: `GET /api/queues/stats`

**Description**: Get overall queue statistics and metrics.

**Response** (200 OK):
```json
{
  "timestamp": "2024-05-19T10:30:00Z",
  "stats": {
    "pending": 42,
    "processing": 5,
    "completed": 1250,
    "failed": 3,
    "total": 1300
  }
}
```

**Error Responses**:
- `500 Internal Server Error` - Server error

---

### 4. Get Failed Tasks

**Endpoint**: `GET /api/queues/failed`

**Description**: Retrieve list of failed tasks. Requires `queue:manage` permission.

**Query Parameters**:
- `limit` (number, optional): Maximum number of tasks to return. Default: 100

**Response** (200 OK):
```json
{
  "count": 3,
  "tasks": [
    {
      "taskId": "task-1234567890-abc123",
      "type": "email",
      "payload": {
        "to": "user@example.com",
        "subject": "Welcome"
      },
      "priority": "normal",
      "status": "failed",
      "retries": 3,
      "maxRetries": 3,
      "createdAt": "2024-05-19T10:30:00Z",
      "error": "SMTP connection failed"
    }
  ]
}
```

**Error Responses**:
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 5. Mark Task as Completed

**Endpoint**: `POST /api/queues/tasks/:taskId/complete`

**Description**: Manually mark a task as completed. Requires `queue:manage` permission.

**Parameters**:
- `taskId` (string, required): Task ID

**Response** (200 OK):
```json
{
  "message": "Task marked as completed",
  "taskId": "task-1234567890-abc123"
}
```

**Error Responses**:
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 6. Mark Task as Failed

**Endpoint**: `POST /api/queues/tasks/:taskId/fail`

**Description**: Manually mark a task as failed. Requires `queue:manage` permission.

**Request Body**:
```json
{
  "error": "Manual failure: Invalid email address"
}
```

**Parameters**:
- `taskId` (string, required): Task ID
- `error` (string, required): Error message

**Response** (200 OK):
```json
{
  "message": "Task marked as failed",
  "taskId": "task-1234567890-abc123",
  "error": "Manual failure: Invalid email address"
}
```

**Error Responses**:
- `400 Bad Request` - Missing error message
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 7. Purge Old Tasks

**Endpoint**: `POST /api/queues/purge`

**Description**: Remove completed tasks older than specified days. Requires `queue:manage` permission.

**Request Body**:
```json
{
  "daysOld": 30
}
```

**Parameters**:
- `daysOld` (number, optional): Delete tasks older than this many days. Default: 30

**Response** (200 OK):
```json
{
  "message": "Old tasks purged",
  "daysOld": 30,
  "deletedCount": 1250
}
```

**Error Responses**:
- `403 Forbidden` - Insufficient permissions
- `500 Internal Server Error` - Server error

---

### 8. Queue Service Health Check

**Endpoint**: `GET /api/queues/health`

**Description**: Check the health status of the queue service. No authentication required.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "service": "queues",
  "timestamp": "2024-05-19T10:30:00Z",
  "stats": {
    "pending": 42,
    "processing": 5,
    "completed": 1250,
    "failed": 3,
    "total": 1300
  }
}
```

**Error Responses**:
- `500 Internal Server Error` - Service unhealthy

---

## Task Types

### Email Task

```json
{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "template": "welcome",
    "data": {
      "name": "John Doe"
    }
  }
}
```

### SMS Task

```json
{
  "type": "sms",
  "payload": {
    "to": "+1234567890",
    "message": "Your verification code is 123456",
    "provider": "twilio"
  }
}
```

### Notification Task

```json
{
  "type": "notification",
  "payload": {
    "userId": "user-123",
    "title": "New Message",
    "message": "You have a new message",
    "channels": ["in_app", "email"]
  }
}
```

### Report Task

```json
{
  "type": "report",
  "payload": {
    "reportType": "financial",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "format": "pdf",
    "userId": "user-123"
  }
}
```

### Billing Task

```json
{
  "type": "billing",
  "payload": {
    "subscriptionId": "sub-123",
    "billingCycle": "monthly",
    "amount": 99.99,
    "currency": "USD"
  }
}
```

### Payroll Task

```json
{
  "type": "payroll",
  "payload": {
    "employeeId": "emp-123",
    "period": "2024-05",
    "baseSalary": 5000,
    "deductions": 500
  }
}
```

## Retry Logic

### Exponential Backoff

Tasks are automatically retried with exponential backoff:

| Attempt | Delay | Total Time |
|---------|-------|-----------|
| 1st | 1 second | 1 second |
| 2nd | 2 seconds | 3 seconds |
| 3rd | 4 seconds | 7 seconds |
| Failed | → Dead Letter Queue | - |

### Retry Configuration

```typescript
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,        // 1 second
  MAX_DELAY: 60000,            // 1 minute
  BACKOFF_MULTIPLIER: 2,
};
```

## Examples

### Example 1: Queue an Email Task

```bash
curl -X POST http://localhost:3000/api/queues/tasks \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "payload": {
      "to": "user@example.com",
      "subject": "Welcome",
      "template": "welcome"
    },
    "priority": "normal"
  }'
```

### Example 2: Check Task Status

```bash
curl -X GET http://localhost:3000/api/queues/tasks/task-1234567890-abc123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Example 3: Get Queue Statistics

```bash
curl -X GET http://localhost:3000/api/queues/stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Example 4: Get Failed Tasks

```bash
curl -X GET "http://localhost:3000/api/queues/failed?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Example 5: Purge Old Tasks

```bash
curl -X POST http://localhost:3000/api/queues/purge \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "daysOld": 30
  }'
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "timestamp": "2024-05-19T10:30:00Z"
}
```

## Permissions

| Endpoint | Permission | Role |
|----------|-----------|------|
| POST /tasks | None | Authenticated |
| GET /tasks/:taskId | None | Authenticated |
| GET /stats | None | Authenticated |
| GET /failed | queue:manage | Admin |
| POST /tasks/:taskId/complete | queue:manage | Admin |
| POST /tasks/:taskId/fail | queue:manage | Admin |
| POST /purge | queue:manage | Admin |
| GET /health | None | Public |

## Best Practices

1. **Task Design**
   - Keep payloads small (< 1MB)
   - Use unique task IDs for idempotency
   - Include all necessary data in payload

2. **Error Handling**
   - Monitor failed tasks regularly
   - Check dead letter queue for persistent failures
   - Implement alerting for high failure rates

3. **Performance**
   - Use appropriate priority levels
   - Monitor queue depth
   - Purge old completed tasks regularly

4. **Monitoring**
   - Check queue statistics regularly
   - Monitor task processing times
   - Alert on queue depth thresholds

## Related Documentation

- [RabbitMQ Configuration Guide](./backend/RABBITMQ_GUIDE.md)
- [API Gateway Documentation](./backend/API_GATEWAY.md)
- [RBAC Guide](./backend/RBAC_GUIDE.md)
