import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/utils/logger.js';
import { getDatabase } from './database.js';
import { getQueueManager } from './queueManager.js';

export interface Plan {
  id: string;
  name: string;
  description?: string;
  pricing: number;
  currency: string;
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  features?: Record<string, any>;
  status: 'active' | 'inactive' | 'deprecated';
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface Subscription {
  id: string;
  client_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  start_date: Date;
  renewal_date: Date;
  amount: number;
  currency: string;
  auto_renew: boolean;
  cancellation_reason?: string;
  cancelled_at?: Date;
  cancelled_by?: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface BillingTransaction {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_date: Date;
  due_date: Date;
  paid_date?: Date;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlanChangeHistory {
  id: string;
  subscription_id: string;
  old_plan_id: string;
  new_plan_id: string;
  old_amount: number;
  new_amount: number;
  proration_amount?: number;
  proration_days?: number;
  change_date: Date;
  effective_date: Date;
  changed_by: string;
  created_at: Date;
}

export interface RenewalReminder {
  id: string;
  subscription_id: string;
  days_before: number;
  reminder_date: Date;
  sent_at?: Date;
  status: 'pending' | 'sent' | 'failed';
  created_at: Date;
}

class SubscriptionService {
  private db: Pool | null = null;

  async initialize(): Promise<void> {
    this.db = await getDatabase();
    logger.info('SubscriptionService initialized');
  }

  // Plan Management
  async createPlan(
    name: string,
    pricing: number,
    billingCycle: 'monthly' | 'quarterly' | 'annual',
    userId: string,
    description?: string,
    features?: Record<string, any>
  ): Promise<Plan> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const id = uuidv4();
    const query = `
      INSERT INTO plans (id, name, description, pricing, currency, billing_cycle, features, status, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const result = await this.db.query(query, [
      id,
      name,
      description || null,
      pricing,
      'USD',
      billingCycle,
      features ? JSON.stringify(features) : null,
      'active',
      userId,
    ]);

    logger.info(`Plan created: ${id}`);
    return result.rows[0];
  }

  async getPlan(planId: string): Promise<Plan | null> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = 'SELECT * FROM plans WHERE id = $1;';
    const result = await this.db.query(query, [planId]);

    return result.rows[0] || null;
  }

  async listPlans(status?: string): Promise<Plan[]> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    let query = 'SELECT * FROM plans';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC;';
    const result = await this.db.query(query, params);

    return result.rows;
  }

  async updatePlan(
    planId: string,
    updates: Partial<Plan>,
    userId: string
  ): Promise<Plan> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const allowedFields = ['name', 'description', 'pricing', 'features', 'status'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(key === 'features' ? JSON.stringify(value) : value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      const plan = await this.getPlan(planId);
      if (!plan) throw new Error('Plan not found');
      return plan;
    }

    values.push(planId);
    const query = `
      UPDATE plans
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await this.db.query(query, values);
    if (result.rows.length === 0) throw new Error('Plan not found');

    logger.info(`Plan updated: ${planId}`);
    return result.rows[0];
  }

  // Subscription Management
  async createSubscription(
    clientId: string,
    planId: string,
    billingCycle: 'monthly' | 'quarterly' | 'annual',
    userId: string,
    startDate?: Date
  ): Promise<Subscription> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const plan = await this.getPlan(planId);
    if (!plan) throw new Error('Plan not found');

    const id = uuidv4();
    const start = startDate || new Date();
    const renewal = this.calculateRenewalDate(start, billingCycle);

    const query = `
      INSERT INTO subscriptions (
        id, client_id, plan_id, status, billing_cycle, start_date, renewal_date,
        amount, currency, auto_renew, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    const result = await this.db.query(query, [
      id,
      clientId,
      planId,
      'active',
      billingCycle,
      start,
      renewal,
      plan.pricing,
      'USD',
      true,
      userId,
    ]);

    logger.info(`Subscription created: ${id}`);

    // Queue renewal reminders
    await this.queueRenewalReminders(id);

    return result.rows[0];
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = 'SELECT * FROM subscriptions WHERE id = $1;';
    const result = await this.db.query(query, [subscriptionId]);

    return result.rows[0] || null;
  }

  async listSubscriptions(clientId?: string, status?: string): Promise<Subscription[]> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    let query = 'SELECT * FROM subscriptions WHERE 1=1';
    const params: any[] = [];

    if (clientId) {
      query += ` AND client_id = $${params.length + 1}`;
      params.push(clientId);
    }

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC;';
    const result = await this.db.query(query, params);

    return result.rows;
  }

  async updateSubscription(
    subscriptionId: string,
    updates: Partial<Subscription>
  ): Promise<Subscription> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const allowedFields = ['status', 'auto_renew'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      const subscription = await this.getSubscription(subscriptionId);
      if (!subscription) throw new Error('Subscription not found');
      return subscription;
    }

    values.push(subscriptionId);
    const query = `
      UPDATE subscriptions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await this.db.query(query, values);
    if (result.rows.length === 0) throw new Error('Subscription not found');

    logger.info(`Subscription updated: ${subscriptionId}`);
    return result.rows[0];
  }

  async cancelSubscription(
    subscriptionId: string,
    reason: string,
    userId: string
  ): Promise<Subscription> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      UPDATE subscriptions
      SET status = 'cancelled', cancellation_reason = $1, cancelled_at = CURRENT_TIMESTAMP,
          cancelled_by = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const result = await this.db.query(query, [reason, userId, subscriptionId]);
    if (result.rows.length === 0) throw new Error('Subscription not found');

    logger.info(`Subscription cancelled: ${subscriptionId}`);

    // Queue cancellation notification
    const queueManager = await getQueueManager();
    await queueManager.enqueueTask('subscription_cancelled', {
      subscriptionId,
      reason,
      cancelledBy: userId,
      timestamp: new Date(),
    });

    return result.rows[0];
  }

  // Plan Change with Proration
  async changePlan(
    subscriptionId: string,
    newPlanId: string,
    userId: string,
    effectiveDate?: Date
  ): Promise<{ subscription: Subscription; transaction: BillingTransaction }> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const subscription = await this.getSubscription(subscriptionId);
    if (!subscription) throw new Error('Subscription not found');

    const oldPlan = await this.getPlan(subscription.plan_id);
    if (!oldPlan) throw new Error('Old plan not found');

    const newPlan = await this.getPlan(newPlanId);
    if (!newPlan) throw new Error('New plan not found');

    const effective = effectiveDate || new Date();

    // Calculate proration
    const proration = this.calculateProration(
      subscription,
      oldPlan,
      newPlan,
      effective
    );

    // Update subscription
    const updateQuery = `
      UPDATE subscriptions
      SET plan_id = $1, amount = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;

    const updateResult = await this.db.query(updateQuery, [
      newPlanId,
      newPlan.pricing,
      subscriptionId,
    ]);

    const updatedSubscription = updateResult.rows[0];

    // Record plan change history
    const historyId = uuidv4();
    const historyQuery = `
      INSERT INTO plan_change_history (
        id, subscription_id, old_plan_id, new_plan_id, old_amount, new_amount,
        proration_amount, proration_days, change_date, effective_date, changed_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;

    await this.db.query(historyQuery, [
      historyId,
      subscriptionId,
      subscription.plan_id,
      newPlanId,
      oldPlan.pricing,
      newPlan.pricing,
      proration.amount,
      proration.days,
      new Date(),
      effective,
      userId,
    ]);

    // Create billing transaction for proration
    const transaction = await this.createBillingTransaction(
      subscriptionId,
      proration.amount,
      'USD',
      new Date(),
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days due date
    );

    logger.info(`Plan changed for subscription: ${subscriptionId}`);

    // Queue plan change notification
    const queueManager = await getQueueManager();
    await queueManager.enqueueTask('plan_changed', {
      subscriptionId,
      oldPlanId: subscription.plan_id,
      newPlanId,
      proratedAmount: proration.amount,
      changedBy: userId,
      timestamp: new Date(),
    });

    return { subscription: updatedSubscription, transaction };
  }

  // Billing Management
  async createBillingTransaction(
    subscriptionId: string,
    amount: number,
    currency: string,
    transactionDate: Date,
    dueDate: Date,
    paymentMethod?: string
  ): Promise<BillingTransaction> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const id = uuidv4();
    const query = `
      INSERT INTO billing_transactions (
        id, subscription_id, amount, currency, status, transaction_date, due_date,
        payment_method
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const result = await this.db.query(query, [
      id,
      subscriptionId,
      amount,
      currency,
      'pending',
      transactionDate,
      dueDate,
      paymentMethod || null,
    ]);

    logger.info(`Billing transaction created: ${id}`);
    return result.rows[0];
  }

  async getBillingTransaction(transactionId: string): Promise<BillingTransaction | null> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = 'SELECT * FROM billing_transactions WHERE id = $1;';
    const result = await this.db.query(query, [transactionId]);

    return result.rows[0] || null;
  }

  async listBillingTransactions(subscriptionId: string): Promise<BillingTransaction[]> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      SELECT * FROM billing_transactions
      WHERE subscription_id = $1
      ORDER BY transaction_date DESC;
    `;

    const result = await this.db.query(query, [subscriptionId]);
    return result.rows;
  }

  async updateBillingTransaction(
    transactionId: string,
    updates: Partial<BillingTransaction>
  ): Promise<BillingTransaction> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const allowedFields = ['status', 'paid_date', 'payment_method', 'reference_number', 'notes'];
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      const transaction = await this.getBillingTransaction(transactionId);
      if (!transaction) throw new Error('Transaction not found');
      return transaction;
    }

    values.push(transactionId);
    const query = `
      UPDATE billing_transactions
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *;
    `;

    const result = await this.db.query(query, values);
    if (result.rows.length === 0) throw new Error('Transaction not found');

    logger.info(`Billing transaction updated: ${transactionId}`);
    return result.rows[0];
  }

  // Renewal Reminders
  async getRenewalReminders(subscriptionId: string): Promise<RenewalReminder[]> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      SELECT * FROM renewal_reminders
      WHERE subscription_id = $1
      ORDER BY reminder_date ASC;
    `;

    const result = await this.db.query(query, [subscriptionId]);
    return result.rows;
  }

  async getPendingRenewalReminders(): Promise<RenewalReminder[]> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      SELECT * FROM renewal_reminders
      WHERE status = 'pending' AND reminder_date <= CURRENT_TIMESTAMP
      ORDER BY reminder_date ASC;
    `;

    const result = await this.db.query(query);
    return result.rows;
  }

  async markReminderAsSent(reminderId: string): Promise<RenewalReminder> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      UPDATE renewal_reminders
      SET status = 'sent', sent_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;

    const result = await this.db.query(query, [reminderId]);
    if (result.rows.length === 0) throw new Error('Reminder not found');

    logger.info(`Renewal reminder marked as sent: ${reminderId}`);
    return result.rows[0];
  }

  async markReminderAsFailed(reminderId: string): Promise<RenewalReminder> {
    if (!this.db) throw new Error('SubscriptionService not initialized');

    const query = `
      UPDATE renewal_reminders
      SET status = 'failed'
      WHERE id = $1
      RETURNING *;
    `;

    const result = await this.db.query(query, [reminderId]);
    if (result.rows.length === 0) throw new Error('Reminder not found');

    logger.info(`Renewal reminder marked as failed: ${reminderId}`);
    return result.rows[0];
  }

  // Helper Methods
  private calculateRenewalDate(
    startDate: Date,
    billingCycle: 'monthly' | 'quarterly' | 'annual'
  ): Date {
    const renewal = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
        renewal.setMonth(renewal.getMonth() + 1);
        break;
      case 'quarterly':
        renewal.setMonth(renewal.getMonth() + 3);
        break;
      case 'annual':
        renewal.setFullYear(renewal.getFullYear() + 1);
        break;
    }

    return renewal;
  }

  private calculateProration(
    subscription: Subscription,
    oldPlan: Plan,
    newPlan: Plan,
    effectiveDate: Date
  ): { amount: number; days: number } {
    const now = new Date();
    const renewalDate = new Date(subscription.renewal_date);

    // Calculate remaining days in current billing cycle
    const totalDays = Math.ceil(
      (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate daily rates
    const oldDailyRate = oldPlan.pricing / this.getDaysInBillingCycle(subscription.billing_cycle);
    const newDailyRate = newPlan.pricing / this.getDaysInBillingCycle(subscription.billing_cycle);

    // Calculate proration amount (difference in daily rates * remaining days)
    const proratedAmount = (newDailyRate - oldDailyRate) * totalDays;

    return {
      amount: Math.round(proratedAmount * 100) / 100, // Round to 2 decimal places
      days: totalDays,
    };
  }

  private getDaysInBillingCycle(billingCycle: string): number {
    switch (billingCycle) {
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'annual':
        return 365;
      default:
        return 30;
    }
  }

  private async queueRenewalReminders(subscriptionId: string): Promise<void> {
    const queueManager = await getQueueManager();
    await queueManager.enqueueTask('renewal_reminders_queued', {
      subscriptionId,
      timestamp: new Date(),
    });
  }
}

let subscriptionService: SubscriptionService | null = null;

export async function getSubscriptionService(): Promise<SubscriptionService> {
  if (!subscriptionService) {
    subscriptionService = new SubscriptionService();
    await subscriptionService.initialize();
  }
  return subscriptionService;
}

export default SubscriptionService;
