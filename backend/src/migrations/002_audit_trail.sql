-- Javalab Tech HQ System - Audit Trail Schema
-- This migration creates immutable audit trail tables

-- Audit log table (immutable)
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_resource (resource),
  INDEX idx_resource_id (resource_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_action (user_id, action),
  INDEX idx_resource_timestamp (resource, timestamp)
);

-- Activity log table (immutable)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  module VARCHAR(50) NOT NULL,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_module (module),
  INDEX idx_action (action),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_module (user_id, module),
  INDEX idx_module_timestamp (module, timestamp)
);

-- Permission change log table (immutable)
CREATE TABLE permission_change_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('role_created', 'role_updated', 'role_deleted', 'permission_created', 'permission_updated', 'permission_deleted', 'permission_assigned', 'permission_removed')),
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  old_value JSONB,
  new_value JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_change_type (change_type),
  INDEX idx_role_id (role_id),
  INDEX idx_permission_id (permission_id),
  INDEX idx_timestamp (timestamp)
);

-- Data access log table (immutable)
CREATE TABLE data_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  access_type VARCHAR(20) NOT NULL CHECK (access_type IN ('read', 'create', 'update', 'delete', 'export')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_resource_type (resource_type),
  INDEX idx_resource_id (resource_id),
  INDEX idx_access_type (access_type),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_resource (user_id, resource_type, resource_id)
);

-- Authentication log table (immutable)
CREATE TABLE authentication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  email VARCHAR(255),
  auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN ('login', 'logout', 'failed_login', 'token_refresh', 'two_fa_setup', 'two_fa_verify')),
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  error_message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_email (email),
  INDEX idx_auth_type (auth_type),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp),
  INDEX idx_user_timestamp (user_id, timestamp)
);

-- System event log table (immutable)
CREATE TABLE system_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  message TEXT,
  details JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type),
  INDEX idx_severity (severity),
  INDEX idx_timestamp (timestamp),
  INDEX idx_event_severity (event_type, severity)
);

-- Create function to prevent updates on audit tables
CREATE OR REPLACE FUNCTION prevent_audit_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit tables are immutable and cannot be updated';
END;
$$ LANGUAGE plpgsql;

-- Create function to prevent deletes on audit tables
CREATE OR REPLACE FUNCTION prevent_audit_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit tables are immutable and cannot be deleted';
END;
$$ LANGUAGE plpgsql;

-- Apply immutability triggers to audit tables
CREATE TRIGGER audit_logs_immutable_update BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER audit_logs_immutable_delete BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

CREATE TRIGGER activity_logs_immutable_update BEFORE UPDATE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER activity_logs_immutable_delete BEFORE DELETE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

CREATE TRIGGER permission_change_logs_immutable_update BEFORE UPDATE ON permission_change_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER permission_change_logs_immutable_delete BEFORE DELETE ON permission_change_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

CREATE TRIGGER data_access_logs_immutable_update BEFORE UPDATE ON data_access_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER data_access_logs_immutable_delete BEFORE DELETE ON data_access_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

CREATE TRIGGER authentication_logs_immutable_update BEFORE UPDATE ON authentication_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER authentication_logs_immutable_delete BEFORE DELETE ON authentication_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

CREATE TRIGGER system_event_logs_immutable_update BEFORE UPDATE ON system_event_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_update();

CREATE TRIGGER system_event_logs_immutable_delete BEFORE DELETE ON system_event_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_delete();

-- Create indexes for audit queries
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource_timestamp ON audit_logs(resource, resource_id, timestamp DESC);
CREATE INDEX idx_activity_logs_user_timestamp ON activity_logs(user_id, timestamp DESC);
CREATE INDEX idx_activity_logs_module_timestamp ON activity_logs(module, timestamp DESC);
CREATE INDEX idx_permission_change_logs_timestamp ON permission_change_logs(timestamp DESC);
CREATE INDEX idx_data_access_logs_user_timestamp ON data_access_logs(user_id, timestamp DESC);
CREATE INDEX idx_authentication_logs_timestamp ON authentication_logs(timestamp DESC);
CREATE INDEX idx_system_event_logs_timestamp ON system_event_logs(timestamp DESC);
