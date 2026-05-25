import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';
import { walletService } from './walletService';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface POSProduct {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost: number;
  stock_level: number;
  reorder_point: number;
  category: string;
  barcode?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface POSTransaction {
  id: string;
  tenant_id: string;
  transaction_date: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  payment_method: string;
  status: string;
  cashier_id?: string;
  created_at: string;
}

export interface POSTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/**
 * POS Service
 * Manages point-of-sale operations including products, transactions, and inventory
 */
export class POSService {
  /**
   * Create POS product
   */
  async createProduct(
    tenantId: string,
    productData: {
      sku: string;
      name: string;
      description?: string;
      price: number;
      cost: number;
      stock_level: number;
      reorder_point: number;
      category: string;
      barcode?: string;
      image_url?: string;
    }
  ): Promise<POSProduct> {
    logger.info(`Creating POS product for tenant ${tenantId}`);

    const { data: product, error } = await supabase
      .from('pos_products')
      .insert({
        tenant_id: tenantId,
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    logger.info(`Successfully created product ${product.id}`);
    return product;
  }

  /**
   * Get product by ID
   */
  async getProduct(productId: string): Promise<POSProduct> {
    const { data: product, error } = await supabase
      .from('pos_products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }

    return product;
  }

  /**
   * Search products by name or barcode
   */
  async searchProducts(tenantId: string, query: string): Promise<POSProduct[]> {
    logger.info(`Searching products for tenant ${tenantId}, query: ${query}`);

    const { data: products, error } = await supabase
      .from('pos_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
      .limit(20);

    if (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }

    return products || [];
  }

  /**
   * Get all products for tenant
   */
  async getTenantProducts(tenantId: string, limit: number = 100, offset: number = 0): Promise<{ products: POSProduct[]; total: number }> {
    logger.info(`Fetching products for tenant ${tenantId}`);

    // Get total count
    const { count, error: countError } = await supabase
      .from('pos_products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (countError) {
      throw new Error(`Failed to count products: ${countError.message}`);
    }

    // Get products
    const { data: products, error: fetchError } = await supabase
      .from('pos_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    return {
      products: products || [],
      total: count || 0
    };
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, updates: Partial<POSProduct>): Promise<POSProduct> {
    logger.info(`Updating product ${productId}`);

    const { data: product, error } = await supabase
      .from('pos_products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    logger.info(`Successfully updated product ${productId}`);
    return product;
  }

  /**
   * Create POS transaction
   */
  async createTransaction(
    tenantId: string,
    items: Array<{ productId: string; quantity: number }>,
    paymentMethod: string,
    discountAmount: number = 0,
    taxRate: number = 0.16,
    cashierId?: string
  ): Promise<POSTransaction> {
    logger.info(`Creating POS transaction for tenant ${tenantId}`);

    // Calculate totals
    let subtotal = 0;
    const transactionItems: Array<{ productId: string; quantity: number; unitPrice: number; lineTotal: number }> = [];

    for (const item of items) {
      const product = await this.getProduct(item.productId);

      if (product.stock_level < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      transactionItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        lineTotal
      });
    }

    // Calculate tax
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * taxRate * 100) / 100;
    const totalAmount = taxableAmount + taxAmount;

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('pos_transactions')
      .insert({
        tenant_id: tenantId,
        transaction_date: new Date().toISOString(),
        total_amount: totalAmount,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        payment_method: paymentMethod,
        status: 'pending',
        cashier_id: cashierId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    // Create transaction items
    for (const item of transactionItems) {
      const { error: itemError } = await supabase
        .from('pos_transaction_items')
        .insert({
          transaction_id: transaction.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          line_total: item.lineTotal,
          created_at: new Date().toISOString()
        });

      if (itemError) {
        throw new Error(`Failed to create transaction item: ${itemError.message}`);
      }

      // Update inventory
      const product = await this.getProduct(item.productId);
      await this.updateProduct(item.productId, {
        stock_level: product.stock_level - item.quantity
      });

      // Record inventory adjustment
      await this.recordInventoryAdjustment(
        tenantId,
        item.productId,
        -item.quantity,
        'sale',
        `Sale transaction ${transaction.id}`,
        cashierId
      );
    }

    // Process payment
    if (paymentMethod === 'wallet') {
      await walletService.debitWallet(tenantId, totalAmount, `POS transaction ${transaction.id}`);
    }

    // Mark transaction as completed
    const { data: completedTransaction, error: updateError } = await supabase
      .from('pos_transactions')
      .update({
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to complete transaction: ${updateError.message}`);
    }

    logger.info(`Successfully created transaction ${transaction.id}`);
    return completedTransaction;
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<POSTransaction> {
    const { data: transaction, error } = await supabase
      .from('pos_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }

    return transaction;
  }

  /**
   * Get transaction items
   */
  async getTransactionItems(transactionId: string): Promise<POSTransactionItem[]> {
    const { data: items, error } = await supabase
      .from('pos_transaction_items')
      .select('*')
      .eq('transaction_id', transactionId);

    if (error) {
      throw new Error(`Failed to fetch transaction items: ${error.message}`);
    }

    return items || [];
  }

  /**
   * Get transactions for tenant
   */
  async getTenantTransactions(
    tenantId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ transactions: POSTransaction[]; total: number }> {
    logger.info(`Fetching transactions for tenant ${tenantId}`);

    let query = supabase
      .from('pos_transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (startDate) {
      query = query.gte('transaction_date', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('transaction_date', endDate.toISOString());
    }

    const { data: transactions, count, error } = await query
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return {
      transactions: transactions || [],
      total: count || 0
    };
  }

  /**
   * Record inventory adjustment
   */
  async recordInventoryAdjustment(
    tenantId: string,
    productId: string,
    quantityChange: number,
    adjustmentType: string,
    reason: string,
    adjustedBy?: string
  ): Promise<void> {
    logger.info(`Recording inventory adjustment for product ${productId}`);

    const { error } = await supabase
      .from('pos_inventory_adjustments')
      .insert({
        tenant_id: tenantId,
        product_id: productId,
        adjustment_type: adjustmentType,
        quantity_change: quantityChange,
        reason,
        adjusted_by: adjustedBy,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to record inventory adjustment: ${error.message}`);
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(tenantId: string): Promise<POSProduct[]> {
    logger.info(`Fetching low stock products for tenant ${tenantId}`);

    const { data: products, error } = await supabase
      .from('pos_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('stock_level', supabase.rpc('get_reorder_point', { tenant_id: tenantId }));

    if (error) {
      logger.error('Failed to fetch low stock products', error);
      return [];
    }

    return products || [];
  }

  /**
   * Get sales summary for date range
   */
  async getSalesSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number;
    totalTransactions: number;
    averageTransactionValue: number;
    totalTax: number;
    totalDiscount: number;
  }> {
    logger.info(`Getting sales summary for tenant ${tenantId}`);

    const { data: transactions, error } = await supabase
      .from('pos_transactions')
      .select('total_amount, tax_amount, discount_amount')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (error) {
      throw new Error(`Failed to get sales summary: ${error.message}`);
    }

    if (!transactions || transactions.length === 0) {
      return {
        totalSales: 0,
        totalTransactions: 0,
        averageTransactionValue: 0,
        totalTax: 0,
        totalDiscount: 0
      };
    }

    const totalSales = transactions.reduce((sum, t) => sum + t.total_amount, 0);
    const totalTax = transactions.reduce((sum, t) => sum + t.tax_amount, 0);
    const totalDiscount = transactions.reduce((sum, t) => sum + t.discount_amount, 0);

    return {
      totalSales,
      totalTransactions: transactions.length,
      averageTransactionValue: totalSales / transactions.length,
      totalTax,
      totalDiscount
    };
  }
}

// Export singleton instance
export const posService = new POSService();
