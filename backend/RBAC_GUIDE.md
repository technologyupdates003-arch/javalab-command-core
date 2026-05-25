# Role-Based Access Control (RBAC) Guide

## Overview

The Javalab Tech HQ System implements a comprehensive Role-Based Access Control (RBAC) system that provides:

- **Role Management** - Create, update, and delete roles
- **Permission Management** - Define granular permissions
- **Role-Permission Mapping** - Assign permissions to roles
- **User Authorization** - Enforce permissions at the API Gateway level
- **Module Access Control** - Control access to specific modules
- **Record-Level Access** - Control access to specific records
- **Permission Caching** - Cache permissions for performance

## Architecture

```
User Request
    ↓
API Gateway
    ├─ Extract JWT Token
    ├─ Load User Permissions (from cache or database)
    ├─ Check Route Permissions
    ├─ Check Module Access
    ├─ Check Record Access
    ↓
Microservice
    ├─ Process Request
    ↓
Response
```

## Concepts

### Roles

A role is a collection of permissions assigned to users. Examples:
- **Admin** - Full system access
- **Manager** - Department/team management
- **Staff** - Limited access to own data
- **Viewer** - Read-only access

### Permissions

A permission is a specific action that can be performed. Format: `module:action`

Examples:
- `clients:read` - Read client data
- `clients:create` - Create new clients
- `clients:update` - Update client data
- `clients:delete` - Delete clients
- `roles:manage_permissions` - Manage role permissions

### Modules

A module is a functional area of the system. Examples:
- `dashboard` - Dashboard module
- `clients` - Client management
- `subscriptions` - Subscription management
- `staff` - Staff management
- `projects` - Project management

## API Endpoints

### Roles Management

#### Get All Roles
```
GET /api/roles?page=1&pageSize=10
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "role-1",
        "name": "admin",
        "description": "Administrator role",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Role Details
```
GET /api/roles/:roleId
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "role-1",
    "name": "admin",
    "description": "Administrator role",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    "permissions": [
      {
        "id": "perm-1",
        "name": "clients:read",
        "description": "Read client data",
        "module": "clients",
        "action": "read"
      }
    ]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Create Role
```
POST /api/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "manager",
  "description": "Manager role"
}
```

**Required Permission**: `roles:create`

**Response** (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "role-2",
    "name": "manager",
    "description": "Manager role",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Update Role
```
PUT /api/roles/:roleId
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "manager",
  "description": "Updated manager role"
}
```

**Required Permission**: `roles:update`

#### Delete Role
```
DELETE /api/roles/:roleId
Authorization: Bearer <token>
```

**Required Permission**: `roles:delete`

#### Add Permission to Role
```
POST /api/roles/:roleId/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "permissionId": "perm-1"
}
```

**Required Permission**: `roles:manage_permissions`

#### Remove Permission from Role
```
DELETE /api/roles/:roleId/permissions/:permissionId
Authorization: Bearer <token>
```

**Required Permission**: `roles:manage_permissions`

### Permissions Management

#### Get All Permissions
```
GET /api/permissions?page=1&pageSize=10&module=clients
Authorization: Bearer <token>
```

**Query Parameters**:
- `page` (optional) - Page number (default: 1)
- `pageSize` (optional) - Items per page (default: 10)
- `module` (optional) - Filter by module

**Response**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "perm-1",
        "name": "clients:read",
        "description": "Read client data",
        "module": "clients",
        "action": "read",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### Get Permission Details
```
GET /api/permissions/:permissionId
Authorization: Bearer <token>
```

#### Create Permission
```
POST /api/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "clients:read",
  "description": "Read client data",
  "module": "clients",
  "action": "read"
}
```

**Required Permission**: `permissions:create`

#### Update Permission
```
PUT /api/permissions/:permissionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "description": "Updated description"
}
```

**Required Permission**: `permissions:update`

#### Delete Permission
```
DELETE /api/permissions/:permissionId
Authorization: Bearer <token>
```

**Required Permission**: `permissions:delete`

#### Get Permissions by Module
```
GET /api/permissions/module/:module
Authorization: Bearer <token>
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "perm-1",
      "name": "clients:read",
      "description": "Read client data",
      "module": "clients",
      "action": "read"
    },
    {
      "id": "perm-2",
      "name": "clients:create",
      "description": "Create client",
      "module": "clients",
      "action": "create"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Middleware Usage

### Require Single Permission
```typescript
import { requirePermission } from '@/middleware/rbac.js';

router.delete(
  '/api/clients/:id',
  authMiddleware,
  requirePermission('clients:delete'),
  (req, res) => {
    // Handle delete
  }
);
```

### Require Any Permission
```typescript
import { requireAnyPermission } from '@/middleware/rbac.js';

router.get(
  '/api/reports',
  authMiddleware,
  requireAnyPermission('reports:read', 'reports:admin'),
  (req, res) => {
    // Handle request
  }
);
```

### Require All Permissions
```typescript
import { requireAllPermissions } from '@/middleware/rbac.js';

router.post(
  '/api/clients/:id/approve',
  authMiddleware,
  requireAllPermissions('clients:read', 'clients:approve'),
  (req, res) => {
    // Handle approval
  }
);
```

### Require Module Access
```typescript
import { requireModuleAccess } from '@/middleware/rbac.js';

router.get(
  '/api/clients',
  authMiddleware,
  requireModuleAccess('clients'),
  (req, res) => {
    // Handle request
  }
);
```

### Require Record Access
```typescript
import { requireRecordAccess } from '@/middleware/rbac.js';

router.get(
  '/api/clients/:id',
  authMiddleware,
  requireRecordAccess('client'),
  (req, res) => {
    // Handle request
  }
);
```

## Permission Caching

Permissions are cached in Redis for performance:

- **User Permissions**: Cached for 1 hour
- **Module Access**: Cached for 1 hour
- **Record Access**: Cached for 1 hour

### Invalidate Cache

```typescript
import {
  invalidateUserPermissions,
  invalidateModuleAccess,
  invalidateRecordAccess
} from '@/middleware/rbac.js';

// Invalidate user permissions
await invalidateUserPermissions(userId);

// Invalidate module access
await invalidateModuleAccess(userId, 'clients');

// Invalidate record access
await invalidateRecordAccess(userId, 'client', recordId);
```

## Permission Naming Convention

Permissions follow the format: `module:action`

### Common Actions

- `read` - Read/view data
- `create` - Create new records
- `update` - Update existing records
- `delete` - Delete records
- `approve` - Approve records
- `reject` - Reject records
- `export` - Export data
- `import` - Import data
- `manage` - Full management (CRUD + special actions)
- `admin` - Administrative access

### Examples

```
clients:read
clients:create
clients:update
clients:delete
clients:approve
clients:export

subscriptions:read
subscriptions:create
subscriptions:update
subscriptions:cancel

staff:read
staff:create
staff:update
staff:delete
staff:manage_payroll

roles:create
roles:update
roles:delete
roles:manage_permissions

permissions:create
permissions:update
permissions:delete
```

## Default Roles

### Admin
- Full system access
- All permissions granted
- Can manage roles and permissions

### Manager
- Department/team management
- Can view and manage team members
- Can view reports
- Limited administrative access

### Staff
- Limited access to own data
- Can view assigned projects
- Can update own profile
- Cannot access sensitive data

### Viewer
- Read-only access
- Can view dashboards and reports
- Cannot modify any data

## Best Practices

### 1. Principle of Least Privilege
- Grant only necessary permissions
- Start with minimal permissions
- Add permissions as needed

### 2. Role Hierarchy
- Create role hierarchy (Admin > Manager > Staff > Viewer)
- Use inheritance where possible
- Avoid permission duplication

### 3. Permission Naming
- Use consistent naming convention
- Use lowercase with colons
- Be specific about actions

### 4. Audit Logging
- Log all permission changes
- Log all access denials
- Monitor permission usage

### 5. Cache Management
- Invalidate cache when permissions change
- Monitor cache hit rates
- Set appropriate TTLs

### 6. Testing
- Test permission enforcement
- Test permission combinations
- Test cache invalidation

## Examples

### Create Admin Role with Full Permissions
```bash
# 1. Create role
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "description": "Administrator role"
  }'

# 2. Get all permissions
curl -X GET http://localhost:3000/api/permissions \
  -H "Authorization: Bearer <token>"

# 3. Add each permission to role
curl -X POST http://localhost:3000/api/roles/role-1/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionId": "perm-1"}'
```

### Create Manager Role with Limited Permissions
```bash
# 1. Create role
curl -X POST http://localhost:3000/api/roles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "manager",
    "description": "Manager role"
  }'

# 2. Add specific permissions
curl -X POST http://localhost:3000/api/roles/role-2/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionId": "perm-1"}' # clients:read

curl -X POST http://localhost:3000/api/roles/role-2/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"permissionId": "perm-2"}' # clients:create
```

## Troubleshooting

### 403 Forbidden Error
- Check if user has required permission
- Verify permission is assigned to user's role
- Check permission cache (may need invalidation)

### Permission Not Taking Effect
- Invalidate user permission cache
- Verify permission is correctly assigned
- Check role assignment

### Performance Issues
- Monitor cache hit rates
- Adjust cache TTL if needed
- Consider permission pre-loading

## Database Schema

### roles table
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### permissions table
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

### role_permissions table
```sql
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
```

### role_modules table
```sql
CREATE TABLE role_modules (
  role_id UUID REFERENCES roles(id),
  module VARCHAR(50),
  PRIMARY KEY (role_id, module)
);
```

### record_access table
```sql
CREATE TABLE record_access (
  user_id UUID REFERENCES users(id),
  resource_type VARCHAR(50),
  resource_id UUID,
  PRIMARY KEY (user_id, resource_type, resource_id)
);
```

---

**RBAC Guide Version**: 1.0
**Last Updated**: May 19, 2026
**Status**: Production Ready
