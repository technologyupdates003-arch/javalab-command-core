# Database Guide - PostgreSQL Schema

## Overview

The Javalab Tech HQ System uses PostgreSQL as the primary database. The schema is organized into three main categories:

1. **Core Tables** - User, role, and permission management
2. **Audit Tables** - Immutable audit trail and logging
3. **Infrastructure Tables** - Sessions, API keys, backups, configuration

## Database Setup

### Prerequisites

- PostgreSQL 15+
- psql command-line tool
- Database user with CREATE privileges

### Connection String

```
postgresql://user:password@localhost:5432/javalab_hq
```

### Environment Variables

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=javalab_hq
DB_USER=postgres
DB_PASSWORD=postgres
```

## Schema Overview

### Core Tables

#### users
Stores user account information and authentication details.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id),
  status VARCHAR(20) DEFAULT 'active',
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_method VARCHAR(20),
  two_fa_secret VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

**Indexes**:
- `idx_email` - Fast email lookups
- `idx_role` - Filter by role
- `idx_status` - Filter by status
- `idx_department_id` - Filter by department
- `idx_users_role_status` - Combined role and status
- `idx_users_department_status` - Combined department and status

#### roles
Defines system roles for access control.

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_name` - Fast role lookups

#### permissions
Defines granular permissions for the system.

```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_name` - Fast permission lookups
- `idx_module` - Filter by module
- `idx_module_action` - Combined module and action

#### role_permissions
Maps permissions to roles (many-to-many).

```sql
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id),
  permission_id UUID NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

#### role_modules
Maps modules to roles for module-level access control.

```sql
CREATE TABLE role_modules (
  role_id UUID NOT NULL REFERENCES roles(id),
  module VARCHAR(50) NOT NULL,
  PRIMARY KEY (role_id, module)
);
```

#### record_access
Stores record-level access control information.

```sql
CREATE TABLE record_access (
  user_id UUID NOT NULL REFERENCES users(id),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  access_level VARCHAR(20) DEFAULT 'read',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_type, resource_id)
);
```

#### departments
Stores department information.

```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id),
  budget DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

### Audit Tables

All audit tables are immutable (no UPDATE or DELETE allowed).

#### audit_logs
Comprehensive audit trail of all system actions.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes**:
- `idx_user_id` - Filter by user
- `idx_action` - Filter by action
- `idx_resource` - Filter by resource
- `idx_timestamp` - Filter by time range
- `idx_user_action` - Combined user and action
- `idx_resource_timestamp` - Combined resource and time

#### activity_logs
User activity tracking.

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### permission_change_logs
Tracks all permission and role changes.

```sql
CREATE TABLE permission_change_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  change_type VARCHAR(50) NOT NULL,
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### data_access_logs
Tracks data access events.

```sql
CREATE TABLE data_access_logs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  access_type VARCHAR(20) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### authentication_logs
Tracks authentication events.

```sql
CREATE TABLE authentication_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  auth_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success',
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### system_event_logs
Tracks system-level events.

```sql
CREATE TABLE system_event_logs (
  id UUID PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'info',
  message TEXT,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Infrastructure Tables

#### sessions
Stores active user sessions.

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### api_keys
Stores API keys for programmatic access.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  permissions TEXT,
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);
```

#### backup_metadata
Stores backup information.

```sql
CREATE TABLE backup_metadata (
  id UUID PRIMARY KEY,
  backup_name VARCHAR(255) NOT NULL,
  backup_size BIGINT,
  backup_location VARCHAR(500),
  backup_type VARCHAR(50) DEFAULT 'full',
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### system_config
Stores system configuration.

```sql
CREATE TABLE system_config (
  id UUID PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### migrations
Tracks database migrations.

```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  version INTEGER NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Migrations

### Running Migrations

Migrations are automatically run on server startup. To manually run migrations:

```bash
curl -X POST http://localhost:3000/api/database/migrations/run \
  -H "Authorization: Bearer <token>"
```

### Available Migrations

1. **001_init_schema.sql** - Core schema (users, roles, permissions, departments)
2. **002_audit_trail.sql** - Audit tables (immutable)

### Creating New Migrations

1. Create a new SQL file in `backend/src/migrations/`
2. Name it with format: `NNN_description.sql` (e.g., `003_add_clients_table.sql`)
3. Write SQL statements separated by semicolons
4. Run migrations on next server startup

## Data Seeding

### Seed Initial Data

```bash
curl -X POST http://localhost:3000/api/database/seed \
  -H "Authorization: Bearer <token>"
```

This creates:
- Default roles (admin, manager, staff, viewer)
- Default permissions for all modules
- Role-permission mappings

## Performance Optimization

### Indexes

The schema includes comprehensive indexes for:
- User lookups by email, role, status
- Permission lookups by name, module
- Audit log queries by user, resource, timestamp
- Activity log queries by module, timestamp

### Query Optimization

**Common Queries**:

```sql
-- Get user with permissions
SELECT u.*, p.name FROM users u
JOIN role_permissions rp ON u.role = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE u.id = $1;

-- Get audit logs for user
SELECT * FROM audit_logs
WHERE user_id = $1
ORDER BY timestamp DESC
LIMIT 100;

-- Get activity by module
SELECT * FROM activity_logs
WHERE module = $1
ORDER BY timestamp DESC
LIMIT 100;
```

### Connection Pooling

The backend uses connection pooling with:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

## Backup and Recovery

### Backup Strategy

```bash
# Full backup
pg_dump -U postgres -h localhost javalab_hq > backup.sql

# Compressed backup
pg_dump -U postgres -h localhost -Fc javalab_hq > backup.dump
```

### Recovery

```bash
# From SQL backup
psql -U postgres -h localhost javalab_hq < backup.sql

# From compressed backup
pg_restore -U postgres -h localhost -d javalab_hq backup.dump
```

## Maintenance

### Vacuum and Analyze

```sql
-- Vacuum (reclaim space)
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE audit_logs;
```

### Check Table Sizes

```sql
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Monitor Connections

```sql
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

## Security

### User Permissions

```sql
-- Create read-only user
CREATE USER readonly WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE javalab_hq TO readonly;
GRANT USAGE ON SCHEMA public TO readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- Create application user
CREATE USER app_user WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE javalab_hq TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;
```

### Audit Trail Immutability

Audit tables are protected with triggers that prevent UPDATE and DELETE operations:

```sql
-- Attempt to update audit log will fail
UPDATE audit_logs SET action = 'modified' WHERE id = '...';
-- ERROR: Audit tables are immutable and cannot be updated
```

## Troubleshooting

### Connection Issues

```bash
# Test connection
psql -U postgres -h localhost -d javalab_hq -c "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

### Migration Failures

```bash
# Check migration status
curl -X GET http://localhost:3000/api/database/migrations/status \
  -H "Authorization: Bearer <token>"

# Check logs
docker-compose logs postgres
```

### Performance Issues

```sql
-- Find slow queries
SELECT query, calls, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC LIMIT 10;

-- Check table bloat
SELECT schemaname, tablename, round(100 * pg_relation_size(schemaname||'.'||tablename) / pg_total_relation_size(schemaname||'.'||tablename)) AS ratio
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema');
```

## API Endpoints

### Database Management

```
GET  /api/database/info                    # Get database info
GET  /api/database/migrations/status       # Get migration status
POST /api/database/migrations/run          # Run pending migrations
POST /api/database/seed                    # Seed initial data
```

---

**Database Guide Version**: 1.0
**Last Updated**: May 19, 2026
**Status**: Production Ready
