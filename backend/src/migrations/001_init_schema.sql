-- Javalab Tech HQ System - Initial Schema
-- This migration creates the core tables for the system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL,
  department_id UUID,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  two_fa_enabled BOOLEAN DEFAULT false,
  two_fa_method VARCHAR(20),
  two_fa_secret VARCHAR(255),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_department_id (department_id)
);

-- Roles table
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
);

-- Permissions table
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_module (module),
  INDEX idx_module_action (module, action)
);

-- Role-Permission mapping table
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id)
);

-- Role-Module mapping table
CREATE TABLE role_modules (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  PRIMARY KEY (role_id, module),
  INDEX idx_role_id (role_id),
  INDEX idx_module (module)
);

-- Record-level access control table
CREATE TABLE record_access (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  access_level VARCHAR(20) DEFAULT 'read' CHECK (access_level IN ('read', 'write', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, resource_type, resource_id),
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id)
);

-- Departments table
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id),
  budget DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_manager_id (manager_id),
  INDEX idx_status (status)
);

-- Add department_id foreign key to users
ALTER TABLE users ADD CONSTRAINT fk_users_department_id 
  FOREIGN KEY (department_id) REFERENCES departments(id);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_token_hash (token_hash),
  INDEX idx_expires_at (expires_at)
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  permissions TEXT,
  rate_limit INTEGER DEFAULT 1000,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_key_hash (key_hash),
  INDEX idx_expires_at (expires_at)
);

-- Backup metadata table
CREATE TABLE backup_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_name VARCHAR(255) NOT NULL,
  backup_size BIGINT,
  backup_location VARCHAR(500),
  backup_type VARCHAR(50) DEFAULT 'full' CHECK (backup_type IN ('full', 'incremental', 'differential')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_backup_name (backup_name),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- System configuration table
CREATE TABLE system_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_key (key)
);

-- Create indexes for common queries
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);
CREATE INDEX idx_roles_created_at ON roles(created_at);
CREATE INDEX idx_permissions_created_at ON permissions(created_at);
CREATE INDEX idx_departments_created_at ON departments(created_at);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);
CREATE INDEX idx_api_keys_created_at ON api_keys(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_department_status ON users(department_id, status);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);
