import { createClient } from '@supabase/supabase-js';
import PDFDocument from 'pdfkit';
import { logger } from '../utils/logger';
import { Readable } from 'stream';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id: string;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  paid_at?: string;
  payment_method?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceData {
  invoice: Invoice;
  tenant: {
    id: string;
    email: string;
    company_name: string;
    phone?: string;
    address?: string;
  };
  product: {
    id: string;
    name: string;
  };
}

/**
 * Invoice Service
 * Manages invoice generation, PDF creation, and storage
 */
export class InvoiceService {
  /**
   * Create invoice for subscription renewal
   */
  async createInvoice(
    tenantId: string,
    subscriptionId: string,
    amount: number,
    taxRate: number = 0.16
  ): Promise<Invoice> {
    logger.info(`Creating invoice for subscription ${subscriptionId}`);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId);

    // Calculate tax and total
    const tax = Math.round(amount * taxRate * 100) / 100;
    const total = amount + tax;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice record
    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        subscription_id: subscriptionId,
        invoice_number: invoiceNumber,
        amount,
        tax,
        total,
        status: 'pending',
        due_date: dueDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    logger.info(`Successfully created invoice ${invoice.invoice_number}`);
    return invoice;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    logger.info(`Fetching invoice ${invoiceId}`);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch invoice: ${error.message}`);
    }

    return invoice;
  }

  /**
   * Get invoices for tenant
   */
  async getTenantInvoices(
    tenantId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ invoices: Invoice[]; total: number }> {
    logger.info(`Fetching invoices for tenant ${tenantId}`);

    // Get total count
    const { count, error: countError } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (countError) {
      throw new Error(`Failed to count invoices: ${countError.message}`);
    }

    // Get invoices
    const { data: invoices, error: fetchError } = await supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      throw new Error(`Failed to fetch invoices: ${fetchError.message}`);
    }

    return {
      invoices: invoices || [],
      total: count || 0
    };
  }

  /**
   * Generate PDF for invoice
   */
  async generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
    logger.info(`Generating PDF for invoice ${invoiceData.invoice.invoice_number}`);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      try {
        // Header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'left' });
        doc.moveDown(0.5);

        // Invoice details
        doc.fontSize(10).font('Helvetica');
        doc.text(`Invoice #: ${invoiceData.invoice.invoice_number}`, { align: 'left' });
        doc.text(`Date: ${this.formatDate(new Date(invoiceData.invoice.created_at))}`, {
          align: 'left'
        });
        doc.text(`Due Date: ${this.formatDate(new Date(invoiceData.invoice.due_date))}`, {
          align: 'left'
        });

        doc.moveDown(1);

        // Bill To section
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', { align: 'left' });
        doc.fontSize(10).font('Helvetica');
        doc.text(invoiceData.tenant.company_name || invoiceData.tenant.email, {
          align: 'left'
        });
        doc.text(invoiceData.tenant.email, { align: 'left' });
        if (invoiceData.tenant.phone) {
          doc.text(invoiceData.tenant.phone, { align: 'left' });
        }
        if (invoiceData.tenant.address) {
          doc.text(invoiceData.tenant.address, { align: 'left' });
        }

        doc.moveDown(1);

        // Items table header
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 350;
        const col3 = 450;

        doc.fontSize(11).font('Helvetica-Bold');
        doc.text('Description', col1, tableTop);
        doc.text('Amount', col2, tableTop);
        doc.text('Total', col3, tableTop);

        // Draw line
        doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

        // Items
        doc.fontSize(10).font('Helvetica');
        let itemY = tableTop + 30;

        doc.text(invoiceData.product.name, col1, itemY);
        doc.text(`${invoiceData.invoice.amount} KES`, col2, itemY);
        doc.text(`${invoiceData.invoice.amount} KES`, col3, itemY);

        itemY += 30;

        // Draw line
        doc.moveTo(50, itemY).lineTo(550, itemY).stroke();

        itemY += 20;

        // Totals
        doc.fontSize(10).font('Helvetica');
        doc.text('Subtotal:', col2, itemY);
        doc.text(`${invoiceData.invoice.amount} KES`, col3, itemY);

        itemY += 20;

        doc.text('Tax (16%):', col2, itemY);
        doc.text(`${invoiceData.invoice.tax} KES`, col3, itemY);

        itemY += 20;

        // Draw line
        doc.moveTo(50, itemY).lineTo(550, itemY).stroke();

        itemY += 10;

        // Total
        doc.fontSize(12).font('Helvetica-Bold');
        doc.text('Total:', col2, itemY);
        doc.text(`${invoiceData.invoice.total} KES`, col3, itemY);

        doc.moveDown(2);

        // Payment instructions
        doc.fontSize(10).font('Helvetica-Bold').text('Payment Instructions:', {
          align: 'left'
        });
        doc.fontSize(9).font('Helvetica');
        doc.text('Please pay the invoice amount by the due date.', { align: 'left' });
        doc.text('Payment methods: M-Pesa, Bank Transfer, Card', { align: 'left' });

        doc.moveDown(1);

        // Footer
        doc.fontSize(8).font('Helvetica').text('Thank you for your business!', {
          align: 'center'
        });
        doc.text('Javalab Tech - www.javalab.tech', { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload PDF to storage
   */
  async uploadInvoicePDF(invoiceId: string, tenantId: string, pdfBuffer: Buffer): Promise<string> {
    logger.info(`Uploading PDF for invoice ${invoiceId}`);

    const fileName = `invoices/${tenantId}/${invoiceId}.pdf`;

    const { error } = await supabase.storage.from('documents').upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });

    if (error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    // Get public URL
    const { data } = supabase.storage.from('documents').getPublicUrl(fileName);

    logger.info(`Successfully uploaded PDF for invoice ${invoiceId}`);
    return data.publicUrl;
  }

  /**
   * Generate and store invoice PDF
   */
  async generateAndStoreInvoicePDF(invoiceData: InvoiceData): Promise<string> {
    logger.info(`Generating and storing PDF for invoice ${invoiceData.invoice.invoice_number}`);

    // Generate PDF
    const pdfBuffer = await this.generateInvoicePDF(invoiceData);

    // Upload to storage
    const pdfUrl = await this.uploadInvoicePDF(
      invoiceData.invoice.id,
      invoiceData.invoice.tenant_id,
      pdfBuffer
    );

    // Update invoice with PDF URL
    const { error } = await supabase
      .from('invoices')
      .update({
        pdf_url: pdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceData.invoice.id);

    if (error) {
      throw new Error(`Failed to update invoice PDF URL: ${error.message}`);
    }

    logger.info(`Successfully generated and stored PDF for invoice ${invoiceData.invoice.id}`);
    return pdfUrl;
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(invoiceId: string, paymentMethod: string): Promise<Invoice> {
    logger.info(`Marking invoice ${invoiceId} as paid`);

    const { data: invoice, error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mark invoice as paid: ${error.message}`);
    }

    logger.info(`Successfully marked invoice ${invoiceId} as paid`);
    return invoice;
  }

  /**
   * Check for overdue invoices and update status
   */
  async updateOverdueInvoices(): Promise<number> {
    logger.info('Checking for overdue invoices');

    const now = new Date().toISOString();

    const { data: overdueInvoices, error: fetchError } = await supabase
      .from('invoices')
      .select('id')
      .eq('status', 'pending')
      .lt('due_date', now);

    if (fetchError) {
      throw new Error(`Failed to fetch overdue invoices: ${fetchError.message}`);
    }

    if (!overdueInvoices || overdueInvoices.length === 0) {
      logger.info('No overdue invoices found');
      return 0;
    }

    // Update status to overdue
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        status: 'overdue',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'pending')
      .lt('due_date', now);

    if (updateError) {
      throw new Error(`Failed to update overdue invoices: ${updateError.message}`);
    }

    logger.info(`Updated ${overdueInvoices.length} invoices to overdue status`);
    return overdueInvoices.length;
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
      .lt('created_at', `${year}-${String(date.getMonth() + 2).padStart(2, '0')}-01`);

    if (error) {
      throw new Error(`Failed to count invoices: ${error.message}`);
    }

    const count = (invoices?.length || 0) + 1;
    const sequence = String(count).padStart(4, '0');

    return `INV-${year}${month}-${sequence}`;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

// Export singleton instance
export const invoiceService = new InvoiceService();
