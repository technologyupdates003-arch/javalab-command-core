# Quick Start Guide - Javalab HQ System

## Prerequisites

- Node.js 20+ ([Download](https://nodejs.org/))
- Docker & Docker Compose ([Download](https://www.docker.com/products/docker-desktop))
- Git

## Setup (5 minutes)

### 1. Clone and Install

```bash
# Navigate to project directory
cd javalab-nexus

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, RabbitMQ, and Elasticsearch
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit if needed (defaults work for local development)
# nano backend/.env
```

### 4. Start Development Servers

**Option A: Run both frontend and backend together**
```bash
npm run dev:all
```

**Option B: Run separately in different terminals**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run dev:backend
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/health
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Elasticsearch**: http://localhost:9200

## Common Commands

### Development

```bash
# Start all services
npm run dev:all

# Start frontend only
npm run dev

# Start backend only
npm run dev:backend

# Build frontend
npm run build

# Build backend
npm run build:backend

# Build both
npm run build:all
```

### Code Quality

```bash
# Lint all code
npm run lint

# Lint backend only
npm run lint:backend

# Format all code
npm run format

# Format backend only
npm run format:backend
```

### Docker

```bash
# Start infrastructure
docker-compose up -d

# Stop infrastructure
docker-compose down

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f rabbitmq
docker-compose logs -f elasticsearch
```

## Project Structure

```
javalab-nexus/
├── backend/                    # Backend services
│   ├── src/
│   │   ├── config/            # Configuration
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── types/             # TypeScript types
│   │   ├── utils/             # Utilities
│   │   └── index.ts           # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── README.md
├── src/                        # Frontend (React)
│   ├── components/            # React components
│   ├── routes/                # Page routes
│   ├── lib/                   # Utilities
│   └── styles.css
├── docker-compose.yml         # Local development environment
├── package.json               # Root workspace
├── TASK_PROGRESS.md          # Task completion status
└── QUICKSTART.md             # This file
```

## API Health Check

Test if the backend is running:

```bash
curl http://localhost:3000/api/health
```

Expected response:
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

## Troubleshooting

### Backend won't start

1. Check if port 3000 is available
2. Verify PostgreSQL is running: `docker-compose ps postgres`
3. Check logs: `npm run dev:backend` (should show errors)

### Database connection failed

1. Ensure PostgreSQL is running: `docker-compose up -d postgres`
2. Wait 10 seconds for PostgreSQL to be ready
3. Check connection string in `backend/.env`

### Redis connection failed

1. Ensure Redis is running: `docker-compose up -d redis`
2. Check Redis is accessible: `docker-compose exec redis redis-cli ping`

### RabbitMQ connection failed

1. Ensure RabbitMQ is running: `docker-compose up -d rabbitmq`
2. Access management UI: http://localhost:15672 (guest/guest)

### Port already in use

If port 3000 or 5173 is already in use:

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Next Steps

1. **Read the documentation**:
   - Backend: `backend/README.md`
   - Task Progress: `TASK_PROGRESS.md`

2. **Explore the code**:
   - Backend entry point: `backend/src/index.ts`
   - Frontend entry point: `src/router.tsx`

3. **Continue with tasks**:
   - Next task: Task 1.2 - Create API Gateway Service
   - See `TASK_PROGRESS.md` for detailed task list

4. **Set up IDE**:
   - Install ESLint extension
   - Install Prettier extension
   - Configure auto-format on save

## Support

For issues or questions:
1. Check `TASK_PROGRESS.md` for completed work
2. Review `backend/README.md` for backend documentation
3. Check Docker logs: `docker-compose logs`
4. Review error messages in terminal

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)
- [React Documentation](https://react.dev/)
- [TanStack Router](https://tanstack.com/router/latest)

---

**Happy coding! 🚀**
