-- Javalab Tech HQ System - Clients and Subscriptions Schema
-- This migration creates tables for client management and subscription management

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  company VARCHAR(255),
  address TEXT,
  kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  kyc_verified_at TIMESTAMP,
  kyc_verified_by UUID REFERENCES users(id),
  compliance_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_email (email),
  INDEX idx_kyc_status (kyc_status),
  INDEX idx_created_at (created_at)
);

-- KYC Documents table
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('id', 'proof_of_address', 'business_license')),
  document_url VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  INDEX idx_client_id (client_id),
  INDEX idx_document_type (document_type),
  INDEX idx_uploaded_at (uploaded_at)
);

-- Plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pricing DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  features JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_name (name),
  INDEX idx_status (status),
  INDEX idx_billing_cycle (billing_cycle)
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual')),
  start_date TIMESTAMP NOT NULL,
  renewal_date TIMESTAMP NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  auto_renew BOOLEAN DEFAULT true,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),
  INDEX idx_client_id (client_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_status (status),
  INDEX idx_renewal_date (renewal_date),
  INDEX idx_created_at (created_at),
  INDEX idx_client_status (client_id, status)
);

-- Billing Transactions table
CREATE TABLE billing_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  transaction_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  payment_method VARCHAR(50),
  reference_number VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_status (status),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_due_date (due_date),
  INDEX idx_subscription_status (subscription_id, status)
);

-- Plan Change History table
CREATE TABLE plan_change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  old_plan_id UUID NOT NULL REFERENCES plans(id),
  new_plan_id UUID NOT NULL REFERENCES plans(id),
  old_amount DECIMAL(15, 2) NOT NULL,
  new_amount DECIMAL(15, 2) NOT NULL,
  proration_amount DECIMAL(15, 2),
  proration_days INTEGER,
  change_date TIMESTAMP NOT NULL,
  effective_date TIMESTAMP NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_change_date (change_date),
  INDEX idx_effective_date (effective_date)
);

-- Renewal Reminders table
CREATE TABLE renewal_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  days_before INTEGER NOT NULL CHECK (days_before IN (30, 7, 1)),
  reminder_date TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_reminder_date (reminder_date),
  INDEX idx_status (status),
  INDEX idx_subscription_status (subscription_id, status)
);

-- Create function to update updated_at timestamp for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscriptions updated_at
CREATE TRIGGER subscriptions_update_timestamp BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_timestamp();

-- Create function to update updated_at timestamp for billing_transactions
CREATE OR REPLACE FUNCTION update_billing_transactions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for billing_transactions updated_at
CREATE TRIGGER billing_transactions_update_timestamp BEFORE UPDATE ON billing_transactions
  FOR EACH ROW EXECUTE FUNCTION update_billing_transactions_timestamp();

-- Create function to generate renewal reminders when subscription is created
CREATE OR REPLACE FUNCTION create_renewal_reminders()
RETURNS TRIGGER AS $$
BEGIN
  -- Create reminders for 30, 7, and 1 day before renewal
  INSERT INTO renewal_reminders (subscription_id, days_before, reminder_date, status)
  VALUES
    (NEW.id, 30, NEW.renewal_date - INTERVAL '30 days', 'pending'),
    (NEW.id, 7, NEW.renewal_date - INTERVAL '7 days', 'pending'),
    (NEW.id, 1, NEW.renewal_date - INTERVAL '1 day', 'pending');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for renewal reminders
CREATE TRIGGER subscriptions_create_reminders AFTER INSERT ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION create_renewal_reminders();

-- Create indexes for common queries
CREATE INDEX idx_clients_created_at ON clients(created_at);
CREATE INDEX idx_clients_updated_at ON clients(updated_at);
CREATE INDEX idx_plans_created_at ON plans(created_at);
CREATE INDEX idx_subscriptions_created_at ON subscriptions(created_at);
CREATE INDEX idx_subscriptions_updated_at ON subscriptions(updated_at);
CREATE INDEX idx_billing_transactions_created_at ON billing_transactions(created_at);
CREATE INDEX idx_plan_change_history_created_at ON plan_change_history(created_at);
CREATE INDEX idx_renewal_reminders_created_at ON renewal_reminders(created_at);

-- Create composite indexes for common queries
CREATE INDEX idx_subscriptions_client_status ON subscriptions(client_id, status);
CREATE INDEX idx_subscriptions_renewal_status ON subscriptions(renewal_date, status) WHERE status = 'active';
CREATE INDEX idx_billing_transactions_subscription_status ON billing_transactions(subscription_id, status);
CREATE INDEX idx_renewal_reminders_pending ON renewal_reminders(reminder_date, status) WHERE status = 'pending';

</content>
</invoke>