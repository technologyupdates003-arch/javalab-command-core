-- Phase 4: POS System

-- Create pos_products table
CREATE TABLE IF NOT EXISTS pos_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL,
  stock_level INT DEFAULT 0,
  reorder_point INT DEFAULT 10,
  category VARCHAR(100),
  barcode VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_sku (sku),
  INDEX idx_barcode (barcode),
  INDEX idx_category (category),
  INDEX idx_stock_level (stock_level)
);

-- Create pos_transactions table
CREATE TABLE IF NOT EXISTS pos_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transaction_date TIMESTAMP NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL, -- cash, card, mpesa, wallet
  status VARCHAR(20) DEFAULT 'completed', -- pending, completed, cancelled
  cashier_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_status (status),
  INDEX idx_cashier_id (cashier_id)
);

-- Create pos_transaction_items table
CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pos_products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_transaction_id (transaction_id),
  INDEX idx_product_id (product_id)
);

-- Create pos_inventory_adjustments table
CREATE TABLE IF NOT EXISTS pos_inventory_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES pos_products(id),
  adjustment_type VARCHAR(50) NOT NULL, -- sale, adjustment, return, restock
  quantity_change INT NOT NULL,
  reason TEXT,
  photo_url VARCHAR(500),
  adjusted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_product_id (product_id),
  INDEX idx_adjustment_type (adjustment_type),
  INDEX idx_created_at (created_at)
);

-- Add RLS policies for pos_products
ALTER TABLE pos_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their products"
  ON pos_products FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can manage their products"
  ON pos_products FOR ALL
  USING (tenant_id = auth.uid());

-- Add RLS policies for pos_transactions
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their transactions"
  ON pos_transactions FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can create transactions"
  ON pos_transactions FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Add RLS policies for pos_transaction_items
ALTER TABLE pos_transaction_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view transaction items"
  ON pos_transaction_items FOR SELECT
  USING (
    transaction_id IN (
      SELECT id FROM pos_transactions WHERE tenant_id = auth.uid()
    )
  );

-- Add RLS policies for pos_inventory_adjustments
ALTER TABLE pos_inventory_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view inventory adjustments"
  ON pos_inventory_adjustments FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can create inventory adjustments"
  ON pos_inventory_adjustments FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pos_products_tenant_category ON pos_products(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_pos_products_tenant_stock ON pos_products(tenant_id, stock_level);
CREATE INDEX IF NOT EXISTS idx_pos_transactions_tenant_date ON pos_transactions(tenant_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_pos_transaction_items_transaction ON pos_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_pos_inventory_tenant_product ON pos_inventory_adjustments(tenant_id, product_id);

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  sku VARCHAR,
  stock_level INT,
  reorder_point INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT pp.id, pp.name, pp.sku, pp.stock_level, pp.reorder_point
  FROM pos_products pp
  WHERE pp.tenant_id = p_tenant_id
  AND pp.stock_level <= pp.reorder_point
  ORDER BY pp.stock_level ASC;
END;
$$ LANGUAGE plpgsql;

-- Create function to get daily sales summary
CREATE OR REPLACE FUNCTION get_daily_sales_summary(p_tenant_id UUID, p_date DATE)
RETURNS TABLE (
  total_sales DECIMAL,
  total_transactions BIGINT,
  average_transaction DECIMAL,
  total_tax DECIMAL,
  total_discount DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(pt.total_amount), 0)::DECIMAL,
    COUNT(*)::BIGINT,
    COALESCE(AVG(pt.total_amount), 0)::DECIMAL,
    COALESCE(SUM(pt.tax_amount), 0)::DECIMAL,
    COALESCE(SUM(pt.discount_amount), 0)::DECIMAL
  FROM pos_transactions pt
  WHERE pt.tenant_id = p_tenant_id
  AND DATE(pt.transaction_date) = p_date
  AND pt.status = 'completed';
END;
$$ LANGUAGE plpgsql;
