import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Subscription {
  id: string;
  tenant_id: string;
  product_id: string;
  amount: number;
  currency: string;
  status: string;
  renewal_date: string;
  auto_renew: boolean;
}

interface Wallet {
  id: string;
  tenant_id: string;
  balance: number;
  currency: string;
}

interface Tenant {
  id: string;
  email: string;
  company_name: string;
}

/**
 * Billing Scheduler Service
 * Runs daily at 2 AM to process subscription renewals
 */
export class BillingScheduler {
  private job: cron.ScheduledTask | null = null;

  /**
   * Start the billing scheduler
   */
  start() {
    // Run every day at 2 AM
    this.job = cron.schedule('0 2 * * *', async () => {
      logger.info('Starting daily billing scheduler');
      try {
        await this.processDailyBilling();
        logger.info('Daily billing scheduler completed successfully');
      } catch (error) {
        logger.error('Daily billing scheduler failed', error);
      }
    });

    logger.info('Billing scheduler started (runs daily at 2 AM)');
  }

  /**
   * Stop the billing scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      logger.info('Billing scheduler stopped');
    }
  }

  /**
   * Process all subscriptions due for renewal today
   */
  private async processDailyBilling() {
    const today = new Date().toISOString().split('T')[0];

    // Find all subscriptions due for renewal today
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('renewal_date', today)
      .eq('status', 'active')
      .eq('auto_renew', true);

    if (fetchError) {
      throw new Error(`Failed to fetch subscriptions: ${fetchError.message}`);
    }

    logger.info(`Found ${subscriptions?.length || 0} subscriptions due for renewal`);

    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    // Process each subscription
    for (const subscription of subscriptions) {
      try {
        await this.processSubscriptionRenewal(subscription);
      } catch (error) {
        logger.error(`Failed to process subscription ${subscription.id}`, error);
        // Continue processing other subscriptions
      }
    }
  }

  /**
   * Process a single subscription renewal
   */
  private async processSubscriptionRenewal(subscription: Subscription) {
    logger.info(`Processing renewal for subscription ${subscription.id}`);

    // Get tenant and wallet
    const tenant = await this.getTenant(subscription.tenant_id);
    const wallet = await this.getWallet(subscription.tenant_id);

    if (!tenant || !wallet) {
      throw new Error(`Tenant or wallet not found for subscription ${subscription.id}`);
    }

    // Check if wallet has sufficient balance
    if (wallet.balance >= subscription.amount) {
      // Process successful renewal
      await this.processSuccessfulRenewal(subscription, wallet, tenant);
    } else {
      // Insufficient balance - schedule retry
      await this.schedulePaymentRetry(subscription, tenant, 1);
    }
  }

  /**
   * Process successful subscription renewal
   */
  private async processSuccessfulRenewal(
    subscription: Subscription,
    wallet: Wallet,
    tenant: Tenant
  ) {
    logger.info(`Processing successful renewal for subscription ${subscription.id}`);

    // Debit wallet
    await this.debitWallet(wallet.id, subscription.amount, `Subscription renewal: ${subscription.id}`);

    // Calculate new renewal date (add 1 month)
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    // Update subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        renewal_date: renewalDate.toISOString().split('T')[0],
        last_renewed: new Date().toISOString(),
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      throw new Error(`Failed to update subscription: ${updateError.message}`);
    }

    // Create invoice
    await this.createInvoice(subscription, tenant);

    // Send confirmation email
    await this.sendRenewalConfirmationEmail(tenant, subscription);

    logger.info(`Successfully renewed subscription ${subscription.id}`);
  }

  /**
   * Schedule payment retry for failed renewal
   */
  private async schedulePaymentRetry(
    subscription: Subscription,
    tenant: Tenant,
    attemptNumber: number
  ) {
    logger.info(`Scheduling payment retry for subscription ${subscription.id}, attempt ${attemptNumber}`);

    // Calculate next retry time based on attempt number
    const nextRetryTime = this.calculateNextRetryTime(attemptNumber);

    // Create billing retry record
    const { error: insertError } = await supabase
      .from('billing_retries')
      .insert({
        subscription_id: subscription.id,
        attempt_number: attemptNumber,
        next_retry_at: nextRetryTime.toISOString(),
        error_message: 'Insufficient wallet balance',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create billing retry: ${insertError.message}`);
    }

    // Send payment reminder email
    await this.sendPaymentReminderEmail(tenant, subscription, nextRetryTime);
  }

  /**
   * Calculate next retry time based on attempt number
   * Attempt 1: 1 hour
   * Attempt 2: 6 hours
   * Attempt 3: 24 hours
   */
  private calculateNextRetryTime(attemptNumber: number): Date {
    const now = new Date();
    const retryDelays = [0, 1, 6, 24]; // hours

    if (attemptNumber >= retryDelays.length) {
      throw new Error(`Max retry attempts exceeded for attempt ${attemptNumber}`);
    }

    const delayHours = retryDelays[attemptNumber];
    const nextRetry = new Date(now.getTime() + delayHours * 60 * 60 * 1000);

    return nextRetry;
  }

  /**
   * Debit wallet for subscription renewal
   */
  private async debitWallet(walletId: string, amount: number, reason: string) {
    logger.info(`Debiting wallet ${walletId} for amount ${amount}`);

    // Create debit transaction
    const { error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        type: 'debit',
        amount,
        reason,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create wallet transaction: ${insertError.message}`);
    }

    // Update wallet balance
    const { data: wallet, error: fetchError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('id', walletId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch wallet: ${fetchError.message}`);
    }

    const newBalance = wallet.balance - amount;

    const { error: updateError } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId);

    if (updateError) {
      throw new Error(`Failed to update wallet balance: ${updateError.message}`);
    }

    logger.info(`Successfully debited wallet ${walletId}`);
  }

  /**
   * Create invoice for subscription renewal
   */
  private async createInvoice(subscription: Subscription, tenant: Tenant) {
    logger.info(`Creating invoice for subscription ${subscription.id}`);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(subscription.tenant_id);

    // Calculate tax (assuming 16% VAT for Kenya)
    const taxRate = 0.16;
    const tax = subscription.amount * taxRate;
    const total = subscription.amount + tax;

    // Create invoice record
    const { error: insertError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: subscription.tenant_id,
        subscription_id: subscription.id,
        invoice_number: invoiceNumber,
        amount: subscription.amount,
        tax,
        total,
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create invoice: ${insertError.message}`);
    }

    logger.info(`Successfully created invoice ${invoiceNumber}`);
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get count of invoices for this tenant this month
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', `${year}-${month}-01`)
      .lt('created_at', `${year}-${month}-32`);

    if (error) {
      throw new Error(`Failed to count invoices: ${error.message}`);
    }

    const count = (invoices?.length || 0) + 1;
    const sequence = String(count).padStart(4, '0');

    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Send renewal confirmation email
   */
  private async sendRenewalConfirmationEmail(tenant: Tenant, subscription: Subscription) {
    logger.info(`Sending renewal confirmation email to ${tenant.email}`);

    // TODO: Implement email sending
    // This would integrate with SendGrid, AWS SES, or similar
    logger.info(`Email would be sent to ${tenant.email}`);
  }

  /**
   * Send payment reminder email
   */
  private async sendPaymentReminderEmail(
    tenant: Tenant,
    subscription: Subscription,
    nextRetryTime: Date
  ) {
    logger.info(`Sending payment reminder email to ${tenant.email}`);

    // TODO: Implement email sending
    logger.info(`Email would be sent to ${tenant.email} for retry at ${nextRetryTime}`);
  }

  /**
   * Get tenant by ID
   */
  private async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from('tenants')
      .select('id, email, company_name')
      .eq('id', tenantId)
      .single();

    if (error) {
      logger.error(`Failed to fetch tenant ${tenantId}`, error);
      return null;
    }

    return data;
  }

  /**
   * Get wallet by tenant ID
   */
  private async getWallet(tenantId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      logger.error(`Failed to fetch wallet for tenant ${tenantId}`, error);
      return null;
    }

    return data;
  }
}

// Export singleton instance
export const billingScheduler = new BillingScheduler();
