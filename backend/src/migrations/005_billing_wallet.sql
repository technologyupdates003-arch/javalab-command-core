-- Phase 1: Recurring Billing & Wallet Management

-- Create wallets table
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KES',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id)
);

-- Create wallet_transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- top_up, debit, refund
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_wallet_id (wallet_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, quarterly, annual
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  start_date TIMESTAMP NOT NULL,
  renewal_date TIMESTAMP NOT NULL,
  last_renewed TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_renewal_date (renewal_date),
  INDEX idx_status (status),
  INDEX idx_auto_renew (auto_renew)
);

-- Create billing_retries table
CREATE TABLE IF NOT EXISTS billing_retries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  attempt_number INT NOT NULL,
  next_retry_at TIMESTAMP NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_subscription_id (subscription_id),
  INDEX idx_next_retry_at (next_retry_at)
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_created ON wallet_transactions(wallet_id, created_at);
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_status ON subscriptions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_renewal_status ON subscriptions(renewal_date, status, auto_renew);

-- Add RLS policies for wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own wallet"
  ON wallets FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own wallet"
  ON wallets FOR UPDATE
  USING (tenant_id = auth.uid());

-- Add RLS policies for wallet_transactions
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their wallet transactions"
  ON wallet_transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE tenant_id = auth.uid()
    )
  );

-- Add RLS policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their subscriptions"
  ON subscriptions FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their subscriptions"
  ON subscriptions FOR UPDATE
  USING (tenant_id = auth.uid());

-- Add RLS policies for invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their invoices"
  ON invoices FOR SELECT
  USING (tenant_id = auth.uid());

-- Create function to initialize wallet on tenant creation
CREATE OR REPLACE FUNCTION initialize_wallet_for_tenant()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (tenant_id, balance, currency)
  VALUES (NEW.id, 0, 'KES');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize wallet
DROP TRIGGER IF EXISTS trigger_initialize_wallet ON tenants;
CREATE TRIGGER trigger_initialize_wallet
  AFTER INSERT ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION initialize_wallet_for_tenant();
