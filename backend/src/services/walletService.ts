import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Wallet {
  id: string;
  tenant_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'top_up' | 'debit' | 'refund';
  amount: number;
  payment_method?: string;
  reason?: string;
  status: 'pending' | 'completed' | 'failed';
  reference_id?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Wallet Service
 * Manages wallet operations including top-ups, debits, and transaction history
 */
export class WalletService {
  /**
   * Get or create wallet for tenant
   */
  async getOrCreateWallet(tenantId: string, currency: string = 'KES'): Promise<Wallet> {
    logger.info(`Getting or creating wallet for tenant ${tenantId}`);

    // Try to get existing wallet
    const { data: existingWallet, error: fetchError } = await supabase
      .from('wallets')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (!fetchError && existingWallet) {
      logger.info(`Found existing wallet for tenant ${tenantId}`);
      return existingWallet;
    }

    // Create new wallet
    logger.info(`Creating new wallet for tenant ${tenantId}`);

    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        tenant_id: tenantId,
        balance: 0,
        currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create wallet: ${createError.message}`);
    }

    logger.info(`Successfully created wallet for tenant ${tenantId}`);
    return newWallet;
  }

  /**
   * Get wallet by tenant ID
   */
  async getWallet(tenantId: string): Promise<Wallet> {
    logger.info(`Fetching wallet for tenant ${tenantId}`);

    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch wallet: ${error.message}`);
    }

    return wallet;
  }

  /**
   * Top up wallet with payment
   */
  async topUpWallet(
    tenantId: string,
    amount: number,
    paymentMethod: string,
    referenceId?: string
  ): Promise<WalletTransaction> {
    logger.info(`Top-up wallet for tenant ${tenantId}, amount: ${amount}, method: ${paymentMethod}`);

    const wallet = await this.getWallet(tenantId);

    // Create pending transaction
    const { data: transaction, error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'top_up',
        amount,
        payment_method: paymentMethod,
        status: 'pending',
        reference_id: referenceId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create transaction: ${insertError.message}`);
    }

    logger.info(`Created pending transaction ${transaction.id}`);

    // Process payment (this would integrate with M-Pesa, Stripe, etc.)
    try {
      const paymentResult = await this.processPayment(amount, paymentMethod, referenceId);

      if (paymentResult.success) {
        // Update transaction to completed
        await this.completeTransaction(transaction.id);

        // Update wallet balance
        await this.updateWalletBalance(wallet.id, wallet.balance + amount);

        logger.info(`Successfully completed top-up for tenant ${tenantId}`);
      } else {
        // Mark transaction as failed
        await this.failTransaction(transaction.id, paymentResult.error);
        throw new Error(`Payment failed: ${paymentResult.error}`);
      }
    } catch (error) {
      // Mark transaction as failed
      await this.failTransaction(transaction.id, String(error));
      throw error;
    }

    return transaction;
  }

  /**
   * Debit wallet for subscription or product usage
   */
  async debitWallet(tenantId: string, amount: number, reason: string): Promise<WalletTransaction> {
    logger.info(`Debiting wallet for tenant ${tenantId}, amount: ${amount}, reason: ${reason}`);

    const wallet = await this.getWallet(tenantId);

    // Check sufficient balance
    if (wallet.balance < amount) {
      throw new Error(`Insufficient wallet balance. Required: ${amount}, Available: ${wallet.balance}`);
    }

    // Create debit transaction
    const { data: transaction, error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'debit',
        amount,
        reason,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create debit transaction: ${insertError.message}`);
    }

    // Update wallet balance
    await this.updateWalletBalance(wallet.id, wallet.balance - amount);

    logger.info(`Successfully debited wallet for tenant ${tenantId}`);
    return transaction;
  }

  /**
   * Refund to wallet
   */
  async refundWallet(tenantId: string, amount: number, reason: string): Promise<WalletTransaction> {
    logger.info(`Refunding wallet for tenant ${tenantId}, amount: ${amount}, reason: ${reason}`);

    const wallet = await this.getWallet(tenantId);

    // Create refund transaction
    const { data: transaction, error: insertError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'refund',
        amount,
        reason,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create refund transaction: ${insertError.message}`);
    }

    // Update wallet balance
    await this.updateWalletBalance(wallet.id, wallet.balance + amount);

    logger.info(`Successfully refunded wallet for tenant ${tenantId}`);
    return transaction;
  }

  /**
   * Get wallet transaction history
   */
  async getTransactionHistory(
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ transactions: WalletTransaction[]; total: number }> {
    logger.info(`Fetching transaction history for tenant ${tenantId}`);

    const wallet = await this.getWallet(tenantId);

    // Get total count
    const { count, error: countError } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_id', wallet.id);

    if (countError) {
      throw new Error(`Failed to count transactions: ${countError.message}`);
    }

    // Get transactions
    const { data: transactions, error: fetchError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch transactions: ${fetchError.message}`);
    }

    return {
      transactions: transactions || [],
      total: count || 0
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(tenantId: string): Promise<number> {
    const wallet = await this.getWallet(tenantId);
    return wallet.balance;
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(tenantId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(tenantId);
    return balance >= amount;
  }

  /**
   * Get low balance alert threshold
   * Returns true if balance is below 20% of average monthly spend
   */
  async isLowBalance(tenantId: string): Promise<boolean> {
    const wallet = await this.getWallet(tenantId);

    // Get average monthly spend
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: transactions, error } = await supabase
      .from('wallet_transactions')
      .select('amount')
      .eq('wallet_id', wallet.id)
      .eq('type', 'debit')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo);

    if (error) {
      logger.error('Failed to calculate average spend', error);
      return false;
    }

    const totalSpend = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const averageMonthlySpend = totalSpend / 30;
    const threshold = averageMonthlySpend * 0.2; // 20% of average

    return wallet.balance < threshold;
  }

  /**
   * Process payment with external provider
   * This is a placeholder - actual implementation would integrate with M-Pesa, Stripe, etc.
   */
  private async processPayment(
    amount: number,
    paymentMethod: string,
    referenceId?: string
  ): Promise<{ success: boolean; error?: string }> {
    logger.info(`Processing payment: amount=${amount}, method=${paymentMethod}`);

    // TODO: Integrate with actual payment providers
    // For now, simulate successful payment
    return { success: true };
  }

  /**
   * Complete transaction
   */
  private async completeTransaction(transactionId: string): Promise<void> {
    const { error } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      throw new Error(`Failed to complete transaction: ${error.message}`);
    }
  }

  /**
   * Fail transaction
   */
  private async failTransaction(transactionId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('wallet_transactions')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transactionId);

    if (error) {
      throw new Error(`Failed to mark transaction as failed: ${error.message}`);
    }

    logger.error(`Transaction ${transactionId} failed: ${errorMessage}`);
  }

  /**
   * Update wallet balance
   */
  private async updateWalletBalance(walletId: string, newBalance: number): Promise<void> {
    const { error } = await supabase
      .from('wallets')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', walletId);

    if (error) {
      throw new Error(`Failed to update wallet balance: ${error.message}`);
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();
