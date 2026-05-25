# RabbitMQ Configuration and Message Queue Guide

## Overview

RabbitMQ is used in the Javalab Tech HQ system for:
- **Asynchronous Task Processing**: Decoupling long-running operations from HTTP requests
- **Email and SMS Delivery**: Queuing notifications for batch processing
- **Report Generation**: Scheduling and processing reports asynchronously
- **Billing Operations**: Processing billing cycles and invoices
- **Payroll Processing**: Handling payroll calculations and distributions
- **Event Broadcasting**: Publishing events for inter-service communication

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (3000)                       │
├─────────────────────────────────────────────────────────────┤
│  ├─ Queue Tasks                                             │
│  ├─ Track Task Status                                       │
│  └─ Manage Retries                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
        ┌────────▼────────────────┐
        │  RabbitMQ (5672)        │
        ├────────────────────────┤
        │ ├─ Email Queue         │
        │ ├─ SMS Queue           │
        │ ├─ Notifications Queue │
        │ ├─ Reports Queue       │
        │ ├─ Billing Queue       │
        │ ├─ Payroll Queue       │
        │ └─ Dead Letter Queue    │
        └────────────────────────┘
                 │
        ┌────────▼────────────────┐
        │  Task Consumers         │
        ├────────────────────────┤
        │ ├─ Email Service       │
        │ ├─ SMS Service         │
        │ ├─ Notification Service│
        │ ├─ Report Service      │
        │ ├─ Billing Service     │
        │ └─ Payroll Service     │
        └────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# RabbitMQ Connection
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/

# Queue Settings
QUEUE_PREFETCH=1              # Number of messages to prefetch
QUEUE_DURABLE=true            # Persist queues on restart
QUEUE_AUTO_DELETE=false       # Don't auto-delete queues

# Retry Settings
QUEUE_MAX_RETRIES=3           # Maximum retry attempts
QUEUE_INITIAL_DELAY=1000      # Initial retry delay (ms)
QUEUE_MAX_DELAY=60000         # Maximum retry delay (ms)
QUEUE_BACKOFF_MULTIPLIER=2    # Exponential backoff multiplier
```

### Docker Compose Configuration

```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  container_name: javalab-rabbitmq
  ports:
    - "5672:5672"    # AMQP port
    - "15672:15672"  # Management UI
  environment:
    RABBITMQ_DEFAULT_USER: guest
    RABBITMQ_DEFAULT_PASS: guest
    RABBITMQ_DEFAULT_VHOST: /
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - javalab-network
```

## Queue Definitions

### 1. Email Queue
- **Name**: `email_queue`
- **Purpose**: Email delivery tasks
- **Priority**: Normal
- **TTL**: 24 hours
- **Max Retries**: 3

**Task Payload**:
```json
{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome",
    "template": "welcome",
    "data": {}
  }
}
```

### 2. SMS Queue
- **Name**: `sms_queue`
- **Purpose**: SMS delivery tasks
- **Priority**: High
- **TTL**: 24 hours
- **Max Retries**: 3

**Task Payload**:
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

### 3. Notifications Queue
- **Name**: `notifications_queue`
- **Purpose**: In-app notifications
- **Priority**: Normal
- **TTL**: 7 days
- **Max Retries**: 2

**Task Payload**:
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

### 4. Reports Queue
- **Name**: `reports_queue`
- **Purpose**: Report generation tasks
- **Priority**: Low
- **TTL**: 7 days
- **Max Retries**: 2

**Task Payload**:
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

### 5. Billing Queue
- **Name**: `billing_queue`
- **Purpose**: Billing and invoice processing
- **Priority**: High
- **TTL**: 30 days
- **Max Retries**: 3

**Task Payload**:
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

### 6. Payroll Queue
- **Name**: `payroll_queue`
- **Purpose**: Payroll processing
- **Priority**: High
- **TTL**: 30 days
- **Max Retries**: 3

**Task Payload**:
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

### 7. Dead Letter Queue
- **Name**: `dead_letter_queue`
- **Purpose**: Failed tasks after max retries
- **TTL**: 90 days
- **Auto-delete**: No

## Retry Logic with Exponential Backoff

### Configuration

```typescript
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 1000,        // 1 second
  MAX_DELAY: 60000,            // 1 minute
  BACKOFF_MULTIPLIER: 2,
};
```

### Retry Schedule

| Attempt | Delay | Total Time |
|---------|-------|-----------|
| 1st | 1 second | 1 second |
| 2nd | 2 seconds | 3 seconds |
| 3rd | 4 seconds | 7 seconds |
| Failed | → Dead Letter Queue | - |

### Retry Logic Flow

```
Task Queued
    ↓
Task Processing
    ├─ Success → Mark Completed
    └─ Failure
        ├─ Retries < Max?
        │  ├─ Yes → Calculate Backoff Delay
        │  │        Wait → Requeue Task
        │  └─ No → Move to Dead Letter Queue
        └─ Log Error
```

## Task Management

### Queue a Task

```typescript
import { queueTask } from '@/services/queueManager.js';

const taskId = await queueTask(
  'email',
  {
    to: 'user@example.com',
    subject: 'Welcome',
    template: 'welcome',
  },
  'normal',
  3
);
```

### Get Task Status

```typescript
import { getTaskStatus } from '@/services/queueManager.js';

const task = await getTaskStatus(taskId);
console.log(task.status); // 'pending', 'processing', 'completed', 'failed'
```

### Handle Task Completion

```typescript
import { completeTask } from '@/services/queueManager.js';

await completeTask(taskId);
```

### Handle Task Failure

```typescript
import { failTask, retryTask } from '@/services/queueManager.js';

try {
  // Process task
} catch (err) {
  const shouldRetry = await retryTask(task);
  if (!shouldRetry) {
    await failTask(taskId, err.message);
  }
}
```

## API Endpoints

### Queue Management

```
POST   /api/queues/tasks                    - Queue a new task
GET    /api/queues/tasks/:taskId            - Get task status
GET    /api/queues/stats                    - Get queue statistics
GET    /api/queues/failed                   - Get failed tasks (admin)
POST   /api/queues/tasks/:taskId/complete   - Mark task completed (admin)
POST   /api/queues/tasks/:taskId/fail       - Mark task failed (admin)
POST   /api/queues/purge                    - Purge old tasks (admin)
GET    /api/queues/health                   - Health check
```

### Queue a Task

**Request**:
```bash
POST /api/queues/tasks
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome"
  },
  "priority": "normal",
  "maxRetries": 3
}
```

**Response** (201 Created):
```json
{
  "message": "Task queued successfully",
  "taskId": "task-1234567890-abc123",
  "type": "email",
  "priority": "normal"
}
```

### Get Task Status

**Request**:
```bash
GET /api/queues/tasks/task-1234567890-abc123
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "taskId": "task-1234567890-abc123",
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome"
  },
  "priority": "normal",
  "status": "completed",
  "retries": 0,
  "maxRetries": 3,
  "createdAt": "2024-05-19T10:30:00Z",
  "processedAt": "2024-05-19T10:30:05Z"
}
```

### Get Queue Statistics

**Request**:
```bash
GET /api/queues/stats
Authorization: Bearer <jwt_token>
```

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

## Monitoring and Maintenance

### RabbitMQ Management UI

Access the management interface at: `http://localhost:15672`

**Default Credentials**:
- Username: `guest`
- Password: `guest`

### Monitor Queue Depth

```bash
# Check queue depth
rabbitmqctl list_queues name messages consumers

# Check queue details
rabbitmqctl list_queues name messages consumers idle_since
```

### Monitor Connections

```bash
# List connections
rabbitmqctl list_connections

# List channels
rabbitmqctl list_channels
```

### Monitor Memory Usage

```bash
# Check memory usage
rabbitmqctl status | grep memory

# Get detailed stats
rabbitmqctl report
```

### Purge a Queue

```bash
# Purge specific queue
rabbitmqctl purge_queue email_queue

# Purge all queues
rabbitmqctl reset
```

## Performance Tuning

### Connection Pooling

```typescript
// Configure connection pool size
const channel = await connection.createChannel();
await channel.prefetch(10); // Prefetch 10 messages
```

### Message Acknowledgment

```typescript
// Manual acknowledgment for reliability
await channel.consume(queueName, async (msg) => {
  try {
    // Process message
    channel.ack(msg);
  } catch (err) {
    // Requeue on error
    channel.nack(msg, false, true);
  }
});
```

### Queue Persistence

```typescript
// Durable queues survive broker restart
await channel.assertQueue(queueName, { durable: true });

// Persistent messages survive broker restart
channel.sendToQueue(queueName, message, { persistent: true });
```

## Troubleshooting

### Issue: Connection Refused

```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Check RabbitMQ logs
docker logs javalab-rabbitmq

# Restart RabbitMQ
docker restart javalab-rabbitmq
```

### Issue: Queue Not Processing

```bash
# Check queue depth
rabbitmqctl list_queues name messages

# Check consumers
rabbitmqctl list_consumers

# Check for errors in logs
docker logs javalab-rabbitmq | grep error
```

### Issue: High Memory Usage

```bash
# Check memory stats
rabbitmqctl status

# Purge old messages
rabbitmqctl purge_queue queue_name

# Increase memory limit
docker update --memory 2g javalab-rabbitmq
```

### Issue: Messages Not Being Processed

```bash
# Check if consumer is connected
rabbitmqctl list_consumers

# Check channel status
rabbitmqctl list_channels

# Verify queue bindings
rabbitmqctl list_bindings
```

## Best Practices

### 1. Task Design
- Keep task payloads small (< 1MB)
- Use unique task IDs for idempotency
- Include retry metadata in task
- Log task start and completion

### 2. Error Handling
- Implement exponential backoff
- Set reasonable max retries (2-5)
- Move failed tasks to dead letter queue
- Monitor dead letter queue regularly

### 3. Performance
- Use message prefetching
- Implement connection pooling
- Use durable queues and messages
- Monitor queue depth

### 4. Monitoring
- Track queue statistics
- Monitor failed tasks
- Alert on high queue depth
- Log all task operations

### 5. Security
- Use strong credentials
- Enable TLS for production
- Restrict network access
- Rotate credentials regularly

## Production Deployment

### Docker Compose for Production

```yaml
rabbitmq:
  image: rabbitmq:3.12-management-alpine
  container_name: javalab-rabbitmq-prod
  ports:
    - "127.0.0.1:5672:5672"    # Only localhost
    - "127.0.0.1:15672:15672"  # Only localhost
  environment:
    RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
    RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    RABBITMQ_DEFAULT_VHOST: /
  volumes:
    - rabbitmq_data:/var/lib/rabbitmq
    - ./rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "ping"]
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

### RabbitMQ Configuration (rabbitmq.conf)

```conf
# Network
listeners.tcp.default = 5672
management.tcp.port = 15672

# Memory
vm_memory_high_watermark.relative = 0.6
vm_memory_high_watermark_paging_ratio = 0.75

# Disk
disk_free_limit.absolute = 2GB

# Queue Master Location
queue_master_location = min-masters

# Clustering
cluster_partition_handling = autoheal

# Logging
log.file.level = info
```

## References

- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [RabbitMQ Tutorials](https://www.rabbitmq.com/getstarted.html)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)
- [amqplib Documentation](https://github.com/squaremo/amqplib)
- [Message Queue Patterns](https://www.rabbitmq.com/patterns.html)
