# Javalab Tech SaaS Platform - Completion Design Document

## Overview

This design document outlines the technical implementation strategy for completing the Javalab Tech SaaS platform. It covers recurring billing, invoicing, authentication enhancements, and all product workspaces.

## Architecture Overview

### Current State
```
Frontend (React)
    ↓
Supabase Auth + Functions
    ↓
PostgreSQL + Realtime
    ↓
M-Pesa Integration
```

### Target State
```
Frontend (React + TanStack)
    ↓
API Layer (Node.js + Express)
    ↓
Service Layer (Billing, Invoicing, Products)
    ↓
Supabase (Auth, Database, Realtime)
    ↓
External Integrations (M-Pesa, Stripe, Google OAuth, etc.)
```

---

## Phase 1: Recurring Billing & Wallet Management

### 1.1 Recurring Billing Scheduler

**Technology**: Node.js + node-cron + Supabase

**Implementation**:
```typescript
// Billing scheduler runs daily at 2 AM
const billingScheduler = cron.schedule('0 2 * * *', async () => {
  // Find all subscriptions due for renewal today
  const dueSubscriptions = await supabase
    .from('subscriptions')
    .select('*')
    .eq('renewal_date', today)
    .eq('status', 'active');
  
  // Process each subscription
  for (const sub of dueSubscriptions) {
    await processSubscriptionRenewal(sub);
  }
});

async function processSubscriptionRenewal(subscription) {
  const tenant = await getTenant(subscription.tenant_id);
  const wallet = await getWallet(tenant.id);
  
  if (wallet.balance >= subscription.amount) {
    // Debit wallet
    await debitWallet(wallet.id, subscription.amount);
    
    // Update subscription
    await updateSubscription(subscription.id, {
      renewal_date: addMonths(new Date(), 1),
      last_renewed: new Date(),
      status: 'active'
    });
    
    // Create invoice
    await createInvoice(subscription);
    
    // Send confirmation email
    await sendEmail(tenant.email, 'Subscription Renewed', {...});
  } else {
    // Send payment reminder
    await sendPaymentReminder(tenant);
    
    // Schedule retry
    await scheduleRetry(subscription.id, 1);
  }
}
```

**Database Schema**:
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES products(id),
  status VARCHAR(20) DEFAULT 'active', -- active, paused, cancelled, expired
  billing_cycle VARCHAR(20), -- monthly, quarterly, annual
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'KES',
  start_date TIMESTAMP,
  renewal_date TIMESTAMP,
  last_renewed TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_renewal_date,
  INDEX idx_tenant_id,
  INDEX idx_status
);

CREATE TABLE billing_retries (
  id UUID PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  attempt_number INT,
  next_retry_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Wallet Management

**Implementation**:
```typescript
// Wallet operations
async function topUpWallet(tenantId, amount, paymentMethod) {
  const wallet = await getWallet(tenantId);
  
  // Create transaction record
  const transaction = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      type: 'top_up',
      amount,
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date()
    });
  
  // Process payment (M-Pesa, Stripe, etc.)
  const paymentResult = await processPayment(amount, paymentMethod);
  
  if (paymentResult.success) {
    // Update wallet balance
    await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('id', wallet.id);
    
    // Mark transaction as completed
    await supabase
      .from('wallet_transactions')
      .update({ status: 'completed', completed_at: new Date() })
      .eq('id', transaction.id);
  }
}

async function debitWallet(walletId, amount, reason) {
  const wallet = await getWallet(walletId);
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Create debit transaction
  await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: walletId,
      type: 'debit',
      amount,
      reason,
      status: 'completed',
      created_at: new Date()
    });
  
  // Update balance
  await supabase
    .from('wallets')
    .update({ balance: wallet.balance - amount })
    .eq('id', walletId);
}
```

**Database Schema**:
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
  balance DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'KES',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type VARCHAR(20), -- top_up, debit, refund
  amount DECIMAL(10, 2),
  payment_method VARCHAR(50), -- mpesa, stripe, bank_transfer
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
  reference_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  INDEX idx_wallet_id,
  INDEX idx_created_at
);
```

---

## Phase 2: Invoice Generation & PDF Export

### 2.1 Invoice Generation

**Technology**: Node.js + PDFKit + Supabase

**Implementation**:
```typescript
async function createInvoice(subscription) {
  const tenant = await getTenant(subscription.tenant_id);
  const product = await getProduct(subscription.product_id);
  
  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(tenant.id);
  
  // Create invoice record
  const invoice = await supabase
    .from('invoices')
    .insert({
      tenant_id: tenant.id,
      subscription_id: subscription.id,
      invoice_number: invoiceNumber,
      amount: subscription.amount,
      tax: calculateTax(subscription.amount),
      total: subscription.amount + calculateTax(subscription.amount),
      status: 'pending',
      due_date: addDays(new Date(), 30),
      created_at: new Date()
    })
    .single();
  
  // Generate PDF
  const pdfBuffer = await generateInvoicePDF(invoice, tenant, product);
  
  // Upload to storage
  const fileName = `invoices/${tenant.id}/${invoice.id}.pdf`;
  await supabase.storage
    .from('documents')
    .upload(fileName, pdfBuffer);
  
  // Send email
  await sendInvoiceEmail(tenant.email, invoice, fileName);
  
  return invoice;
}

async function generateInvoicePDF(invoice, tenant, product) {
  const doc = new PDFDocument();
  
  // Header
  doc.fontSize(20).text('INVOICE', 100, 50);
  doc.fontSize(10).text(`Invoice #: ${invoice.invoice_number}`, 100, 80);
  doc.text(`Date: ${formatDate(invoice.created_at)}`, 100, 95);
  doc.text(`Due Date: ${formatDate(invoice.due_date)}`, 100, 110);
  
  // Tenant details
  doc.fontSize(12).text('Bill To:', 100, 150);
  doc.fontSize(10)
    .text(tenant.company_name, 100, 170)
    .text(tenant.email, 100, 185)
    .text(tenant.phone, 100, 200);
  
  // Items table
  doc.fontSize(12).text('Items', 100, 250);
  doc.fontSize(10)
    .text('Description', 100, 270)
    .text('Amount', 400, 270);
  
  doc.text(product.name, 100, 290);
  doc.text(`${invoice.amount} KES`, 400, 290);
  
  // Totals
  doc.fontSize(10)
    .text('Subtotal:', 350, 350)
    .text(`${invoice.amount} KES`, 450, 350);
  
  doc.text('Tax:', 350, 370)
    .text(`${invoice.tax} KES`, 450, 370);
  
  doc.fontSize(12).text('Total:', 350, 400)
    .text(`${invoice.total} KES`, 450, 400);
  
  // Footer
  doc.fontSize(8).text('Thank you for your business!', 100, 700);
  
  return doc;
}
```

**Database Schema**:
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2),
  tax DECIMAL(10, 2),
  total DECIMAL(10, 2),
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id,
  INDEX idx_invoice_number,
  INDEX idx_status
);
```

---

## Phase 3: Authentication Enhancements

### 3.1 Google OAuth Integration

**Technology**: Supabase Auth + Google OAuth

**Implementation**:
```typescript
// Frontend
async function signUpWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app/onboarding`
    }
  });
}

// Backend - Handle OAuth callback
async function handleGoogleCallback(user) {
  // Check if user exists
  let dbUser = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .single();
  
  if (!dbUser) {
    // Create new user
    dbUser = await supabase
      .from('users')
      .insert({
        email: user.email,
        name: user.user_metadata.full_name,
        avatar_url: user.user_metadata.avatar_url,
        auth_provider: 'google',
        created_at: new Date()
      })
      .single();
  }
  
  // Redirect to onboarding or first tenant
  const tenant = await getFirstTenant(dbUser.id);
  if (tenant) {
    return redirect(`/app/${tenant.slug}`);
  } else {
    return redirect('/app/onboarding');
  }
}
```

**Supabase Configuration**:
```sql
-- Enable Google OAuth in Supabase
-- Settings → Authentication → Providers → Google
-- Add Google OAuth credentials from Google Cloud Console
```

### 3.2 Password Reset Flow

**Implementation**:
```typescript
// Request password reset
async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  });
  
  if (error) throw error;
}

// Handle reset link
async function resetPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
  
  // Invalidate all sessions
  await supabase.auth.signOut({ scope: 'global' });
}
```

---

## Phase 4: Product Workspaces

### 4.1 POS System Architecture

**Technology**: React + TanStack + Supabase + Stripe/M-Pesa

**Database Schema**:
```sql
CREATE TABLE pos_products (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  sku VARCHAR(100) UNIQUE,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10, 2),
  cost DECIMAL(10, 2),
  stock_level INT,
  reorder_point INT,
  category VARCHAR(100),
  barcode VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id,
  INDEX idx_sku,
  INDEX idx_barcode
);

CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  transaction_date TIMESTAMP,
  total_amount DECIMAL(10, 2),
  tax_amount DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2),
  payment_method VARCHAR(50), -- cash, card, mpesa, wallet
  status VARCHAR(20) DEFAULT 'completed',
  cashier_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id,
  INDEX idx_transaction_date
);

CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES pos_transactions(id),
  product_id UUID NOT NULL REFERENCES pos_products(id),
  quantity INT,
  unit_price DECIMAL(10, 2),
  line_total DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pos_inventory_adjustments (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_id UUID NOT NULL REFERENCES pos_products(id),
  adjustment_type VARCHAR(50), -- sale, adjustment, return, restock
  quantity_change INT,
  reason TEXT,
  photo_url VARCHAR(500),
  adjusted_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id,
  INDEX idx_product_id
);
```

### 4.2 Hosting Platform Architecture

**Technology**: Node.js + Docker + Kubernetes + Let's Encrypt

**Database Schema**:
```sql
CREATE TABLE hosting_domains (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  domain_name VARCHAR(255) UNIQUE,
  registrar VARCHAR(100),
  expiration_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  status VARCHAR(20), -- active, expired, pending
  nameservers TEXT[], -- Array of nameservers
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id,
  INDEX idx_expiration_date
);

CREATE TABLE hosting_sites (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  domain_id UUID REFERENCES hosting_domains(id),
  site_name VARCHAR(255),
  git_url VARCHAR(500),
  build_command VARCHAR(500),
  start_command VARCHAR(500),
  environment_variables JSONB,
  ssl_certificate_id UUID,
  status VARCHAR(20), -- active, deploying, failed
  uptime_percentage DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tenant_id
);

CREATE TABLE hosting_deployments (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES hosting_sites(id),
  commit_hash VARCHAR(100),
  deployment_status VARCHAR(20), -- pending, building, deploying, success, failed
  build_log TEXT,
  deployed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site_id,
  INDEX idx_deployment_status
);

CREATE TABLE hosting_backups (
  id UUID PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES hosting_sites(id),
  backup_date TIMESTAMP,
  backup_size_mb INT,
  storage_url VARCHAR(500),
  status VARCHAR(20), -- completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_site_id,
  INDEX idx_backup_date
);
```

---

## Phase 5: Remaining Products

### 5.1 Wallet Product

**Database Schema**:
```sql
CREATE TABLE wallet_users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  phone_number VARCHAR(20) UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0,
  kyc_status VARCHAR(20), -- unverified, pending, verified
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE wallet_transfers (
  id UUID PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES wallet_users(id),
  to_user_id UUID NOT NULL REFERENCES wallet_users(id),
  amount DECIMAL(10, 2),
  status VARCHAR(20), -- pending, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 School Management System

**Database Schema**:
```sql
CREATE TABLE school_students (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  student_id VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  class VARCHAR(50),
  parent_email VARCHAR(255),
  parent_phone VARCHAR(20),
  fees_amount DECIMAL(10, 2),
  fees_paid DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE school_grades (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES school_students(id),
  subject VARCHAR(100),
  grade VARCHAR(2),
  term INT,
  year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE school_attendance (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES school_students(id),
  attendance_date TIMESTAMP,
  status VARCHAR(20), -- present, absent, late
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3 Hospital Management System

**Database Schema**:
```sql
CREATE TABLE hospital_patients (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  patient_id VARCHAR(50) UNIQUE,
  name VARCHAR(255),
  date_of_birth DATE,
  phone VARCHAR(20),
  email VARCHAR(255),
  medical_history TEXT,
  allergies TEXT,
  insurance_provider VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_appointments (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES hospital_patients(id),
  doctor_id UUID REFERENCES users(id),
  appointment_date TIMESTAMP,
  status VARCHAR(20), -- scheduled, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_prescriptions (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES hospital_patients(id),
  medication VARCHAR(255),
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Implementation Timeline

### Phase 1: Recurring Billing (2 weeks)
- Billing scheduler setup
- Wallet management
- Retry logic
- Testing

### Phase 2: Invoicing (1 week)
- Invoice generation
- PDF export
- Email delivery
- Storage integration

### Phase 3: Auth Enhancements (1 week)
- Google OAuth setup
- Password reset flow
- Testing

### Phase 4: POS System (3 weeks)
- Dashboard
- Terminal
- Inventory
- Reports

### Phase 5: Hosting Platform (4 weeks)
- Domain management
- Deployment
- SSL certificates
- Monitoring

### Phase 6: Remaining Products (6 weeks)
- Wallet (1 week)
- School (1 week)
- Hospital (1 week)
- HR (1 week)
- Booking (1 week)
- Mobile/Website builders (1 week)

**Total: 18 weeks (~4.5 months)**

---

## Technology Stack

### Backend
- Node.js 20+
- Express.js
- TypeScript
- Supabase (Auth, Database, Realtime, Storage)
- node-cron (Scheduling)
- PDFKit (PDF generation)
- Stripe SDK (Payments)
- Docker (Containerization)

### Frontend
- React 19+
- TanStack Router
- TanStack Query
- Tailwind CSS
- Shadcn/ui
- Recharts (Analytics)

### Infrastructure
- Supabase (Managed PostgreSQL)
- Docker (Containerization)
- Kubernetes (Orchestration)
- GitHub Actions (CI/CD)
- AWS S3 / Google Cloud Storage (File storage)

---

## Security Considerations

1. **Billing Security**
   - PCI DSS compliance for payment processing
   - Encrypted wallet transactions
   - Audit trail for all financial operations

2. **Authentication**
   - OAuth 2.0 for Google integration
   - JWT tokens with short expiration
   - Secure password reset tokens

3. **Data Protection**
   - AES-256 encryption for sensitive data
   - TLS 1.3 for data in transit
   - Row-level security in PostgreSQL

4. **API Security**
   - Rate limiting per tenant
   - API key rotation
   - Request signing for webhooks

