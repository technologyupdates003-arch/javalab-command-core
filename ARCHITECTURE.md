# Javalab HQ System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  React Frontend (Port 5173)                                          │  │
│  │  - TanStack Router for navigation                                    │  │
│  │  - TanStack Query for data fetching                                  │  │
│  │  - Tailwind CSS + Shadcn/ui for UI                                   │  │
│  │  - WebSocket client for real-time updates                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY LAYER (Port 3000)                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  Express.js API Gateway                                              │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Middleware Stack:                                              │ │  │
│  │  │ 1. CORS Handler                                                │ │  │
│  │  │ 2. JSON Parser                                                 │ │  │
│  │  │ 3. Global Rate Limiter (100 req/15 min)                       │ │  │
│  │  │ 4. Optional Auth Middleware (JWT validation)                  │ │  │
│  │  │ 5. Request Logging                                             │ │  │
│  │  │ 6. Error Handler                                               │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────────┐ │  │
│  │  │ Routes:                                                        │ │  │
│  │  │ - GET  /api/health              → System health check         │ │  │
│  │  │ - POST /api/auth/login          → Authentication (future)     │ │  │
│  │  │ - POST /api/auth/logout         → Logout (future)             │ │  │
│  │  │ - GET  /api/dashboard/*         → Dashboard service           │ │  │
│  │  │ - GET  /api/clients/*           → Client management service   │ │  │
│  │  │ - ... (15 module routes)                                       │ │  │
│  │  └────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP
┌─────────────────────────────────────────────────────────────────────────────┐
│                      MICROSERVICES LAYER (Ports 3101-3115)                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │  Dashboard   │ │  Clients     │ │ Subscriptions│ │  Staff       │      │
│  │  (3101)      │ │  (3102)      │ │  (3103)      │ │  (3104)      │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ Departments  │ │  Projects    │ │  Vault       │ │  Office      │      │
│  │  (3105)      │ │  (3106)      │ │  (3107)      │ │  (3108)      │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │  Marketing   │ │  SMS         │ │  Support     │ │  Finance     │      │
│  │  (3109)      │ │  (3110)      │ │  (3111)      │ │  (3112)      │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                       │
│  │  Security    │ │  Developer   │ │  Products    │                       │
│  │  (3113)      │ │  (3114)      │ │  (3115)      │                       │
│  └──────────────┘ └──────────────┘ └──────────────┘                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CROSS-CUTTING SERVICES LAYER                               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ Notification │ │  Search      │ │  Audit/Logs  │ │  Export      │      │
│  │  Service     │ │  Service     │ │  Service     │ │  Service     │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│  ┌──────────────┐ ┌──────────────┐                                         │
│  │  WebSocket   │ │  Cache       │                                         │
│  │  Service     │ │  Service     │                                         │
│  └──────────────┘ └──────────────┘                                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                  DATA & INFRASTRUCTURE LAYER                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ PostgreSQL   │ │  Redis       │ │  RabbitMQ    │ │ Elasticsearch│      │
│  │  (5432)      │ │  (6379)      │ │  (5672)      │ │  (9200)      │      │
│  │              │ │              │ │              │ │              │      │
│  │ - Users      │ │ - Sessions   │ │ - Email      │ │ - Full-text  │      │
│  │ - Clients    │ │ - Cache      │ │ - SMS        │ │   search     │      │
│  │ - Audit      │ │ - Locks      │ │ - Notif      │ │ - Indexing   │      │
│  │ - Roles      │ │              │ │ - Reports    │ │              │      │
│  │ - Perms      │ │              │ │ - Billing    │ │              │      │
│  │ - ... (15    │ │              │ │ - Payroll    │ │              │      │
│  │   modules)   │ │              │ │              │ │              │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Request Flow
```
Client Request
    ↓
API Gateway (Port 3000)
    ├─ CORS Check
    ├─ Rate Limit Check
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

### Real-time Update Flow
```
Data Change Event
    ↓
Microservice
    ├─ Update Database
    ├─ Publish Event
    ↓
WebSocket Service
    ├─ Broadcast to Subscribers
    ↓
Connected Clients
    ├─ Receive Update (< 500ms)
    ├─ Update UI
```

### Async Task Flow
```
Async Operation Needed
    ↓
Microservice
    ├─ Create Task
    ├─ Publish to Queue
    ↓
RabbitMQ
    ├─ Store Message
    ├─ Retry on Failure
    ↓
Queue Consumer
    ├─ Process Task
    ├─ Update Status
    ↓
Notification (if needed)
    ├─ Send to User
```

## Service Communication

### Synchronous (HTTP)
```
API Gateway ←→ Microservices
Microservice ←→ Microservice (via API Gateway or direct)
```

### Asynchronous (Message Queue)
```
Microservice → RabbitMQ → Consumer
```

### Real-time (WebSocket)
```
Microservice → WebSocket Service → Connected Clients
```

### Caching
```
Request → Cache Check → Hit? → Return Cached Data
                    ↓
                   Miss
                    ↓
            Query Database
                    ↓
            Store in Cache
                    ↓
            Return Data
```

### Search
```
Data Change → Elasticsearch Index Update
Search Query → Elasticsearch → Results
```

## Deployment Architecture

### Local Development
```
Docker Compose
├─ PostgreSQL Container
├─ Redis Container
├─ RabbitMQ Container
├─ Elasticsearch Container
└─ Host Machine
   ├─ Frontend Dev Server (npm run dev)
   └─ Backend Dev Server (npm run dev:backend)
```

### Production (Kubernetes)
```
Kubernetes Cluster
├─ API Gateway Pod(s)
├─ Microservice Pods (15 modules)
├─ Cross-Cutting Service Pods
├─ PostgreSQL StatefulSet
├─ Redis StatefulSet
├─ RabbitMQ StatefulSet
├─ Elasticsearch StatefulSet
├─ Ingress Controller
└─ Service Mesh (optional)
```

## Technology Stack

### Backend
```
Node.js 20+
├─ Express.js (HTTP Server)
├─ TypeScript (Type Safety)
├─ PostgreSQL (Primary Database)
├─ Redis (Cache & Sessions)
├─ RabbitMQ (Message Queue)
├─ Elasticsearch (Search)
├─ Socket.io (WebSocket)
├─ JWT (Authentication)
├─ Pino (Logging)
└─ Zod (Validation)
```

### Frontend
```
React 19+
├─ TanStack Router (Routing)
├─ TanStack Query (Data Fetching)
├─ Tailwind CSS (Styling)
├─ Shadcn/ui (Components)
├─ Framer Motion (Animations)
├─ Recharts (Charts)
└─ Socket.io Client (Real-time)
```

### Infrastructure
```
Docker
├─ Multi-stage builds
├─ Health checks
├─ Non-root users
└─ Resource limits

Docker Compose (Local)
├─ Service orchestration
├─ Volume management
├─ Network configuration
└─ Health checks

Kubernetes (Production)
├─ Pod orchestration
├─ Service discovery
├─ Load balancing
├─ Auto-scaling
├─ Rolling updates
└─ Health checks
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Network Security                                             │
│    - CORS configuration                                         │
│    - TLS/SSL encryption (production)                            │
│    - Firewall rules                                             │
├─────────────────────────────────────────────────────────────────┤
│ 2. Authentication                                               │
│    - JWT tokens                                                 │
│    - 2FA (TOTP/SMS)                                             │
│    - Session management                                         │
├─────────────────────────────────────────────────────────────────┤
│ 3. Authorization                                                │
│    - RBAC (Role-Based Access Control)                           │
│    - Permission-based access                                    │
│    - Record-level access control                                │
├─────────────────────────────────────────────────────────────────┤
│ 4. Data Protection                                              │
│    - AES-256 encryption (at rest)                               │
│    - TLS 1.3 (in transit)                                       │
│    - Hashed passwords (bcrypt)                                  │
├─────────────────────────────────────────────────────────────────┤
│ 5. Input Validation                                             │
│    - Schema validation (Zod)                                    │
│    - SQL injection prevention                                   │
│    - XSS protection                                             │
├─────────────────────────────────────────────────────────────────┤
│ 6. Audit & Logging                                              │
│    - Immutable audit trail                                      │
│    - Activity logging                                           │
│    - Error logging                                              │
├─────────────────────────────────────────────────────────────────┤
│ 7. Rate Limiting                                                │
│    - Global rate limiter                                        │
│    - Auth rate limiter                                          │
│    - API rate limiter                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Real-time Updates | < 500ms | WebSocket + Redis |
| Standard Queries | < 2s | Database + Cache |
| Health Checks | < 1s | Direct checks |
| Cache Hit Rate | > 80% | Redis caching |
| API Response | < 200ms | Optimized queries |
| Search Response | < 1s | Elasticsearch |
| Concurrent Users | 10,000+ | Horizontal scaling |

## Scalability Strategy

### Horizontal Scaling
```
Load Balancer
├─ API Gateway Instance 1
├─ API Gateway Instance 2
├─ API Gateway Instance N
└─ Microservice Instances (auto-scaled)
```

### Vertical Scaling
```
Increase Resources
├─ CPU cores
├─ Memory
├─ Disk space
└─ Network bandwidth
```

### Database Scaling
```
PostgreSQL
├─ Read replicas
├─ Connection pooling
├─ Query optimization
├─ Partitioning
└─ Sharding (if needed)
```

### Cache Scaling
```
Redis
├─ Cluster mode
├─ Replication
├─ Persistence
└─ Eviction policies
```

## Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                             │
├─────────────────────────────────────────────────────────────────┤
│ Metrics Collection                                              │
│ └─ Prometheus                                                   │
│    ├─ API response times                                        │
│    ├─ Request counts                                            │
│    ├─ Error rates                                               │
│    ├─ Database connections                                      │
│    └─ Cache hit rates                                           │
├─────────────────────────────────────────────────────────────────┤
│ Visualization                                                   │
│ └─ Grafana                                                      │
│    ├─ System dashboards                                         │
│    ├─ Service dashboards                                        │
│    ├─ Business metrics                                          │
│    └─ Alerts                                                    │
├─────────────────────────────────────────────────────────────────┤
│ Logging                                                         │
│ └─ ELK Stack (Elasticsearch, Logstash, Kibana)                 │
│    ├─ Application logs                                          │
│    ├─ Access logs                                               │
│    ├─ Error logs                                                │
│    └─ Audit logs                                                │
├─────────────────────────────────────────────────────────────────┤
│ Tracing                                                         │
│ └─ Jaeger (optional)                                            │
│    ├─ Request tracing                                           │
│    ├─ Service dependencies                                      │
│    └─ Performance analysis                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Disaster Recovery

```
┌─────────────────────────────────────────────────────────────────┐
│                  DISASTER RECOVERY PLAN                         │
├─────────────────────────────────────────────────────────────────┤
│ Backup Strategy                                                 │
│ ├─ Daily automated backups                                      │
│ ├─ Geo-distributed storage                                      │
│ ├─ Point-in-time recovery                                       │
│ └─ Backup verification                                          │
├─────────────────────────────────────────────────────────────────┤
│ Recovery Procedures                                             │
│ ├─ Database recovery                                            │
│ ├─ Service recovery                                             │
│ ├─ Data recovery                                                │
│ └─ Communication plan                                           │
├─────────────────────────────────────────────────────────────────┤
│ High Availability                                               │
│ ├─ Multi-region deployment                                      │
│ ├─ Database replication                                         │
│ ├─ Load balancing                                               │
│ └─ Auto-failover                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: May 19, 2026
**Status**: Foundation Complete - Ready for Microservices Implementation
