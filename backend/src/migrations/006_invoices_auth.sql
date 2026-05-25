-- Phase 2: Invoice Generation & PDF Export
-- Phase 3: Authentication Enhancements

-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  auth_provider VARCHAR(50) DEFAULT 'email', -- email, google, github
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_auth_provider (auth_provider)
);

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Add RLS policies for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Add RLS policies for password_resets
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own password resets"
  ON password_resets FOR SELECT
  USING (user_id = auth.uid());

-- Add RLS policies for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

-- Create function to clean up expired password resets
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets
  WHERE expires_at < NOW() AND used = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update invoice status to overdue
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void AS $$
BEGIN
  UPDATE invoices
  SET status = 'overdue', updated_at = NOW()
  WHERE status = 'pending' AND due_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_expires ON password_resets(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);
