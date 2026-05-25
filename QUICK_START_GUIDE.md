# Quick Start Guide - Javalab Tech HQ System

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Step 1: Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
```

### Step 2: Start Docker Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL (5432)
- Redis (6379)
- RabbitMQ (5672, 15672 for UI)
- Elasticsearch (9200)

### Step 3: Run Database Migrations
```bash
npm run db:migrate
```

### Step 4: Start Development Servers
```bash
npm run dev:all
```

This starts:
- Frontend (React) on http://localhost:5173
- Backend (API Gateway) on http://localhost:3000
- WebSocket on ws://localhost:3000

### Step 5: Access the System

**API Gateway**: http://localhost:3000
```bash
curl http://localhost:3000/api/health
```

**WebSocket**: ws://localhost:3000
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});
```

**RabbitMQ Management**: http://localhost:15672
- Username: guest
- Password: guest

---

## 📚 Key Documentation

| Document | Purpose |
|----------|---------|
| [INFRASTRUCTURE_COMPLETE.md](./INFRASTRUCTURE_COMPLETE.md) | Complete infrastructure overview |
| [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md) | API endpoints reference |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| [backend/API_GATEWAY.md](./backend/API_GATEWAY.md) | API Gateway documentation |
| [backend/RBAC_GUIDE.md](./backend/RBAC_GUIDE.md) | RBAC system guide |
| [backend/DATABASE_GUIDE.md](./backend/DATABASE_GUIDE.md) | Database schema |
| [backend/REDIS_GUIDE.md](./backend/REDIS_GUIDE.md) | Redis configuration |
| [backend/RABBITMQ_GUIDE.md](./backend/RABBITMQ_GUIDE.md) | RabbitMQ setup |
| [SESSION_API_REFERENCE.md](./SESSION_API_REFERENCE.md) | Session management API |
| [QUEUE_API_REFERENCE.md](./QUEUE_API_REFERENCE.md) | Queue management API |

---

## 🔑 Key Endpoints

### Health Check
```bash
GET http://localhost:3000/api/health
```

### Authentication
```bash
# Login
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

# Verify Token
GET http://localhost:3000/api/auth/verify
Authorization: Bearer <token>
```

### Queue a Task
```bash
POST http://localhost:3000/api/queues/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "email",
  "payload": {
    "to": "user@example.com",
    "subject": "Welcome"
  },
  "priority": "normal"
}
```

### Get Queue Stats
```bash
GET http://localhost:3000/api/queues/stats
Authorization: Bearer <token>
```

### WebSocket Connection
```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.emit('subscribe', { channel: 'notifications' });
socket.on('message', (data) => {
  console.log('Message:', data);
});
```

---

## 🛠️ Common Commands

```bash
# Development
npm run dev:all              # Start all services
npm run dev:frontend        # Start frontend only
npm run dev:backend         # Start backend only

# Building
npm run build               # Build for production
npm run build:frontend      # Build frontend
npm run build:backend       # Build backend

# Testing
npm run test:run            # Run all tests
npm run test:watch          # Watch mode

# Database
npm run db:migrate          # Run migrations
npm run db:seed             # Seed database
npm run db:reset            # Reset database

# Code Quality
npm run lint                # Run linter
npm run format              # Format code
npm run type-check          # Check types

# Docker
docker-compose up -d        # Start services
docker-compose down         # Stop services
docker-compose logs -f      # View logs
```

---

## 📊 System Architecture

```
Frontend (React)
    ↓ HTTP + WebSocket
API Gateway (Express.js)
    ├─ Authentication
    ├─ Rate Limiting
    ├─ RBAC
    └─ Routing
    ↓
┌───┴───┬────────┬──────────┬──────────┐
│       │        │          │          │
PostgreSQL  Redis  RabbitMQ  Elasticsearch
│       │        │          │
└───┬───┴────────┴──────────┴──────────┘
    ↓
15 Microservices
```

---

## 🔐 Security

### JWT Token
- Issued on login
- Expires in 24 hours
- Required for all authenticated endpoints
- Verified on every request

### Rate Limiting
- Global: 1000 req/min
- Per-user: 100 req/min
- Per-IP: 500 req/min

### RBAC
- Role-based access control
- Granular permissions
- Module-level access
- Record-level access

### Audit Trail
- All operations logged
- Immutable audit tables
- User tracking
- Change history

---

## 📈 Performance

### Caching
- Redis for sessions and cache
- 24-hour session TTL
- Pattern-based invalidation
- Cache warming on startup

### Database
- 30+ indexes
- Connection pooling
- Query optimization
- Batch operations

### Async Processing
- RabbitMQ for async tasks
- Exponential backoff retries
- Dead letter queue
- Task status tracking

### Real-time Updates
- WebSocket for live updates
- Room-based messaging
- Channel subscriptions
- Event broadcasting

---

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check Docker services
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Database Connection Error
```bash
# Check PostgreSQL
docker-compose logs postgres

# Reset database
npm run db:reset
npm run db:migrate
```

### Redis Connection Error
```bash
# Check Redis
docker-compose logs redis

# Clear Redis
docker exec javalab-redis redis-cli FLUSHALL
```

### RabbitMQ Connection Error
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Access management UI
http://localhost:15672
```

---

## 📝 Environment Variables

Create `backend/.env`:
```bash
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
REDIS_DB=0

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRY=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
```

---

## 🎯 Next Steps

1. **Explore the API**: Use the endpoints in [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
2. **Read the Architecture**: Check [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Understand RBAC**: Review [backend/RBAC_GUIDE.md](./backend/RBAC_GUIDE.md)
4. **Learn the Database**: Study [backend/DATABASE_GUIDE.md](./backend/DATABASE_GUIDE.md)
5. **Implement Services**: Start with core module services

---

## 📞 Support

For detailed information, refer to:
- **API Documentation**: [API_QUICK_REFERENCE.md](./API_QUICK_REFERENCE.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Infrastructure**: [INFRASTRUCTURE_COMPLETE.md](./INFRASTRUCTURE_COMPLETE.md)
- **All Tasks Summary**: [ALL_TASKS_COMPLETE_SUMMARY.md](./ALL_TASKS_COMPLETE_SUMMARY.md)

---

## ✅ Verification Checklist

After starting the system, verify:

- [ ] Frontend loads at http://localhost:5173
- [ ] API Gateway responds at http://localhost:3000/api/health
- [ ] Database migrations completed
- [ ] Redis connection established
- [ ] RabbitMQ connection established
- [ ] WebSocket server running
- [ ] Authentication working
- [ ] Rate limiting active
- [ ] RBAC enforcement working
- [ ] Queue management operational

---

**Status**: ✅ Ready to use!

Start developing with the Javalab Tech HQ System.
