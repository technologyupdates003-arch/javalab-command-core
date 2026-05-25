import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { walletService } from './walletService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Subscription {
  id: string;
  tenant_id: string;
  product_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  currency: string;
  start_date: string;
  renewal_date: string;
  last_renewed?: string;
  auto_renew: boolean;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Subscription Service
 * Manages subscription lifecycle including creation, renewal, and cancellation
 */
export class SubscriptionService {
  /**
   * Create new subscription
   */
  async createSubscription(
    tenantId: string,
    productId: string,
    amount: number,
    billingCycle: 'monthly' | 'quarterly' | 'annual' = 'monthly',
    currency: string = 'KES'
  ): Promise<Subscription> {
    logger.info(`Creating subscription for tenant ${tenantId}, product ${productId}`);

    // Calculate renewal date based on billing cycle
    const startDate = new Date();
    const renewalDate = this.calculateRenewalDate(startDate, billingCycle);

    // Create subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        status: 'active',
        billing_cycle: billingCycle,
        amount,
        currency,
        start_date: startDate.toISOString(),
        renewal_date: renewalDate.toISOString(),
        auto_renew: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }

    logger.info(`Successfully created subscription ${subscription.id}`);
    return subscription;
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Subscription> {
    logger.info(`Fetching subscription ${subscriptionId}`);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }

    return subscription;
  }

  /**
   * Get all subscriptions for tenant
   */
  async getTenantSubscriptions(tenantId: string): Promise<Subscription[]> {
    logger.info(`Fetching subscriptions for tenant ${tenantId}`);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    return subscriptions || [];
  }

  /**
   * Get active subscriptions for tenant
   */
  async getActiveSubscriptions(tenantId: string): Promise<Subscription[]> {
    logger.info(`Fetching active subscriptions for tenant ${tenantId}`);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch active subscriptions: ${error.message}`);
    }

    return subscriptions || [];
  }

  /**
   * Cancel subscription with prorated refund
   */
  async cancelSubscription(
    subscriptionId: string,
    cancellationReason: string
  ): Promise<{ subscription: Subscription; refundAmount: number }> {
    logger.info(`Cancelling subscription ${subscriptionId}, reason: ${cancellationReason}`);

    const subscription = await this.getSubscription(subscriptionId);

    // Calculate prorated refund
    const refundAmount = this.calculateProratedRefund(
      subscription.amount,
      new Date(subscription.renewal_date),
      new Date()
    );

    // Update subscription status
    const { data: updatedSubscription, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellationReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to cancel subscription: ${updateError.message}`);
    }

    // Process refund if amount > 0
    if (refundAmount > 0) {
      await walletService.refundWallet(
        subscription.tenant_id,
        refundAmount,
        `Refund for cancelled subscription ${subscriptionId}`
      );
    }

    logger.info(`Successfully cancelled subscription ${subscriptionId}, refund: ${refundAmount}`);

    return {
      subscription: updatedSubscription,
      refundAmount
    };
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string): Promise<Subscription> {
    logger.info(`Pausing subscription ${subscriptionId}`);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }

    logger.info(`Successfully paused subscription ${subscriptionId}`);
    return subscription;
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string): Promise<Subscription> {
    logger.info(`Resuming subscription ${subscriptionId}`);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }

    logger.info(`Successfully resumed subscription ${subscriptionId}`);
    return subscription;
  }

  /**
   * Change subscription plan
   */
  async changePlan(
    subscriptionId: string,
    newAmount: number,
    newBillingCycle: 'monthly' | 'quarterly' | 'annual'
  ): Promise<Subscription> {
    logger.info(`Changing plan for subscription ${subscriptionId}`);

    const subscription = await this.getSubscription(subscriptionId);

    // Calculate prorated adjustment
    const proratedAdjustment = this.calculateProratedAdjustment(
      subscription.amount,
      newAmount,
      new Date(subscription.renewal_date),
      new Date()
    );

    // Apply adjustment to wallet
    if (proratedAdjustment > 0) {
      // Charge additional amount
      await walletService.debitWallet(
        subscription.tenant_id,
        proratedAdjustment,
        `Plan upgrade for subscription ${subscriptionId}`
      );
    } else if (proratedAdjustment < 0) {
      // Refund difference
      await walletService.refundWallet(
        subscription.tenant_id,
        Math.abs(proratedAdjustment),
        `Plan downgrade for subscription ${subscriptionId}`
      );
    }

    // Update subscription
    const newRenewalDate = this.calculateRenewalDate(new Date(), newBillingCycle);

    const { data: updatedSubscription, error } = await supabase
      .from('subscriptions')
      .update({
        amount: newAmount,
        billing_cycle: newBillingCycle,
        renewal_date: newRenewalDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to change plan: ${error.message}`);
    }

    logger.info(`Successfully changed plan for subscription ${subscriptionId}`);
    return updatedSubscription;
  }

  /**
   * Check if subscription is active
   */
  async isSubscriptionActive(subscriptionId: string): Promise<boolean> {
    const subscription = await this.getSubscription(subscriptionId);
    return subscription.status === 'active';
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(subscriptionId: string): Promise<string> {
    const subscription = await this.getSubscription(subscriptionId);
    return subscription.status;
  }

  /**
   * Calculate renewal date based on billing cycle
   */
  private calculateRenewalDate(startDate: Date, billingCycle: string): Date {
    const renewalDate = new Date(startDate);

    switch (billingCycle) {
      case 'monthly':
        renewalDate.setMonth(renewalDate.getMonth() + 1);
        break;
      case 'quarterly':
        renewalDate.setMonth(renewalDate.getMonth() + 3);
        break;
      case 'annual':
        renewalDate.setFullYear(renewalDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Unknown billing cycle: ${billingCycle}`);
    }

    return renewalDate;
  }

  /**
   * Calculate prorated refund for mid-cycle cancellation
   */
  private calculateProratedRefund(amount: number, renewalDate: Date, cancellationDate: Date): number {
    const cycleStart = new Date(renewalDate);
    cycleStart.setMonth(cycleStart.getMonth() - 1);

    const totalDays = Math.floor((renewalDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.floor((renewalDate.getTime() - cancellationDate.getTime()) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return 0;
    }

    const dailyRate = amount / totalDays;
    return Math.round(dailyRate * remainingDays * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate prorated adjustment for plan changes
   */
  private calculateProratedAdjustment(
    oldAmount: number,
    newAmount: number,
    renewalDate: Date,
    changeDate: Date
  ): number {
    const cycleStart = new Date(renewalDate);
    cycleStart.setMonth(cycleStart.getMonth() - 1);

    const totalDays = Math.floor((renewalDate.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.floor((renewalDate.getTime() - changeDate.getTime()) / (1000 * 60 * 60 * 24));

    if (remainingDays <= 0) {
      return 0;
    }

    const oldDailyRate = oldAmount / totalDays;
    const newDailyRate = newAmount / totalDays;
    const adjustment = (newDailyRate - oldDailyRate) * remainingDays;

    return Math.round(adjustment * 100) / 100; // Round to 2 decimals
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
