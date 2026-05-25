# Javalab Tech HQ System - Backend

Backend services for the Javalab Tech Digital Headquarters system.

## Architecture

The backend is organized as a microservices architecture with:

- **API Gateway**: Central entry point for all requests (port 3000)
- **Microservices**: Individual services for each module (ports 3101-3115)
- **Cross-Cutting Services**: Shared services like notifications, search, audit logging
- **Infrastructure**: PostgreSQL, Redis, RabbitMQ, Elasticsearch

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration management
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic and external service integrations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.ts         # API Gateway entry point
├── dist/                # Compiled JavaScript (generated)
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── .eslintrc.json       # ESLint configuration
├── .prettierrc           # Prettier configuration
└── .env.example         # Environment variables template
```

## Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- RabbitMQ 3.12+
- Elasticsearch 8+

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

### Development

Start the development server with hot reload:

```bash
npm run dev
```

The API Gateway will be available at `http://localhost:3000`

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Start the production server:

```bash
npm start
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns system health status including database, cache, and message queue connectivity.

## Services

### Database Service

Manages PostgreSQL connections with connection pooling.

**Features:**
- Connection pooling (max 20 connections)
- Automatic reconnection
- Query execution with parameters

### Cache Service

Manages Redis connections for caching and sessions.

**Features:**
- Key-value storage with TTL support
- Pattern-based invalidation
- Automatic serialization/deserialization

### Message Queue Service

Manages RabbitMQ connections for asynchronous task processing.

**Queues:**
- `email_queue` - Email sending tasks
- `sms_queue` - SMS sending tasks
- `notifications_queue` - Notification delivery
- `reports_queue` - Report generation
- `billing_queue` - Billing operations
- `payroll_queue` - Payroll processing

## Middleware

### Authentication

Validates JWT tokens and extracts user context.

```typescript
// Protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  const userId = req.context?.userId;
  // ...
});
```

### Authorization

Enforces role-based and permission-based access control.

```typescript
// Role-based access
app.post('/api/admin', requireRole('admin'), (req, res) => {
  // ...
});

// Permission-based access
app.delete('/api/users/:id', requirePermission('users:delete'), (req, res) => {
  // ...
});
```

### Rate Limiting

Prevents abuse with configurable rate limits.

- Global: 100 requests per 15 minutes
- Auth: 5 requests per 15 minutes
- API: 60 requests per minute

### Error Handling

Centralized error handling with consistent response format.

```typescript
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

## Configuration

Environment variables are managed in `.env` file:

```env
# API Gateway
API_GATEWAY_PORT=3000
API_GATEWAY_HOST=localhost

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=javalab_hq
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Message Queue
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Services
DASHBOARD_SERVICE_URL=http://localhost:3101
# ... other services
```

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Format with Prettier

```bash
npm run lint
npm run format
```

### Testing

Run tests with:

```bash
npm run test
```

Run tests once (CI mode):

```bash
npm run test:run
```

## Deployment

### Docker

Build Docker image:

```bash
docker build -t javalab-hq-backend .
```

Run container:

```bash
docker run -p 3000:3000 --env-file .env javalab-hq-backend
```

### Kubernetes

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/
```

## Monitoring

### Logs

Logs are output to console in development and to file in production.

Log levels: `debug`, `info`, `warn`, `error`

### Metrics

Prometheus metrics are available at `/metrics` (when implemented)

### Health Checks

Kubernetes health checks:

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Troubleshooting

### Database Connection Failed

- Check PostgreSQL is running
- Verify connection string in `.env`
- Check firewall rules

### Redis Connection Failed

- Check Redis is running
- Verify Redis host and port in `.env`
- Check Redis password if configured

### Message Queue Connection Failed

- Check RabbitMQ is running
- Verify RabbitMQ URL in `.env`
- Check RabbitMQ credentials

## Contributing

1. Create a feature branch
2. Make changes following code style guidelines
3. Run tests and linting
4. Submit pull request

## License

Proprietary - Javalab Tech
