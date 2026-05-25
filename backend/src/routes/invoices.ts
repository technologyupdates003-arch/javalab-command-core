import { Router, Request, Response } from 'express';
import { invoiceService } from '../services/invoiceService';
import { subscriptionService } from '../services/subscriptionService';
import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/invoices
 * Get all invoices for authenticated tenant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await invoiceService.getTenantInvoices(tenantId, limit, offset);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get invoices', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

/**
 * GET /api/invoices/:id
 * Get invoice by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const invoiceId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.getInvoice(invoiceId);

    // Verify invoice belongs to tenant
    if (invoice.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(invoice);
  } catch (error) {
    logger.error('Failed to get invoice', error);
    res.status(500).json({ error: 'Failed to get invoice' });
  }
});

/**
 * GET /api/invoices/:id/download
 * Download invoice PDF
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const invoiceId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.getInvoice(invoiceId);

    // Verify invoice belongs to tenant
    if (invoice.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (!invoice.pdf_url) {
      return res.status(404).json({ error: 'PDF not available' });
    }

    // Redirect to PDF URL
    res.redirect(invoice.pdf_url);
  } catch (error) {
    logger.error('Failed to download invoice', error);
    res.status(500).json({ error: 'Failed to download invoice' });
  }
});

/**
 * POST /api/invoices/:id/mark-paid
 * Mark invoice as paid
 */
router.post('/:id/mark-paid', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const invoiceId = req.params.id;
    const { paymentMethod } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    const invoice = await invoiceService.getInvoice(invoiceId);

    // Verify invoice belongs to tenant
    if (invoice.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedInvoice = await invoiceService.markInvoiceAsPaid(invoiceId, paymentMethod);

    res.json(updatedInvoice);
  } catch (error) {
    logger.error('Failed to mark invoice as paid', error);
    res.status(500).json({ error: 'Failed to mark invoice as paid' });
  }
});

/**
 * POST /api/invoices/generate
 * Generate invoice for subscription (admin only)
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { subscriptionId, taxRate } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ error: 'Subscription ID required' });
    }

    // Get subscription
    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, email, company_name, phone, address')
      .eq('id', subscription.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', subscription.product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create invoice
    const invoice = await invoiceService.createInvoice(
      subscription.tenant_id,
      subscriptionId,
      subscription.amount,
      taxRate || 0.16
    );

    // Generate and store PDF
    const pdfUrl = await invoiceService.generateAndStoreInvoicePDF({
      invoice,
      tenant,
      product
    });

    res.status(201).json({
      ...invoice,
      pdf_url: pdfUrl
    });
  } catch (error) {
    logger.error('Failed to generate invoice', error);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

/**
 * POST /api/invoices/:id/regenerate-pdf
 * Regenerate PDF for existing invoice
 */
router.post('/:id/regenerate-pdf', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const invoiceId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const invoice = await invoiceService.getInvoice(invoiceId);

    // Verify invoice belongs to tenant
    if (invoice.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get subscription
    const subscription = await subscriptionService.getSubscription(invoice.subscription_id);

    // Get tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, email, company_name, phone, address')
      .eq('id', invoice.tenant_id)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Get product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', subscription.product_id)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate and store PDF
    const pdfUrl = await invoiceService.generateAndStoreInvoicePDF({
      invoice,
      tenant,
      product
    });

    res.json({
      ...invoice,
      pdf_url: pdfUrl
    });
  } catch (error) {
    logger.error('Failed to regenerate PDF', error);
    res.status(500).json({ error: 'Failed to regenerate PDF' });
  }
});

export default router;
