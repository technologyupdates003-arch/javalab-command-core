import { Router, Request, Response } from 'express';
import { posService } from '../services/posService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/pos/products
 * Create POS product
 */
router.post('/products', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const productData = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productData.sku || !productData.name || !productData.price) {
      return res.status(400).json({ error: 'SKU, name, and price required' });
    }

    const product = await posService.createProduct(tenantId, productData);

    res.status(201).json(product);
  } catch (error) {
    logger.error('Failed to create product', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/**
 * GET /api/pos/products
 * Get all products for tenant
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await posService.getTenantProducts(tenantId, limit, offset);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get products', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

/**
 * GET /api/pos/products/search
 * Search products
 */
router.get('/products/search', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const query = req.query.q as string;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const products = await posService.searchProducts(tenantId, query);

    res.json(products);
  } catch (error) {
    logger.error('Failed to search products', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

/**
 * GET /api/pos/products/:id
 * Get product by ID
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;

    const product = await posService.getProduct(productId);

    res.json(product);
  } catch (error) {
    logger.error('Failed to get product', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

/**
 * PUT /api/pos/products/:id
 * Update product
 */
router.put('/products/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const productId = req.params.id;
    const updates = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const product = await posService.getProduct(productId);

    // Verify product belongs to tenant
    if (product.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedProduct = await posService.updateProduct(productId, updates);

    res.json(updatedProduct);
  } catch (error) {
    logger.error('Failed to update product', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/**
 * POST /api/pos/transactions
 * Create POS transaction
 */
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { items, paymentMethod, discountAmount, taxRate, cashierId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items required' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    const transaction = await posService.createTransaction(
      tenantId,
      items,
      paymentMethod,
      discountAmount || 0,
      taxRate || 0.16,
      cashierId
    );

    res.status(201).json(transaction);
  } catch (error) {
    logger.error('Failed to create transaction', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/pos/transactions
 * Get transactions for tenant
 */
router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await posService.getTenantTransactions(tenantId, startDate, endDate, limit, offset);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get transactions', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * GET /api/pos/transactions/:id
 * Get transaction by ID
 */
router.get('/transactions/:id', async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.id;

    const transaction = await posService.getTransaction(transactionId);
    const items = await posService.getTransactionItems(transactionId);

    res.json({
      ...transaction,
      items
    });
  } catch (error) {
    logger.error('Failed to get transaction', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
});

/**
 * GET /api/pos/low-stock
 * Get low stock products
 */
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const products = await posService.getLowStockProducts(tenantId);

    res.json(products);
  } catch (error) {
    logger.error('Failed to get low stock products', error);
    res.status(500).json({ error: 'Failed to get low stock products' });
  }
});

/**
 * GET /api/pos/sales-summary
 * Get sales summary
 */
router.get('/sales-summary', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await posService.getSalesSummary(tenantId, startDate, endDate);

    res.json(summary);
  } catch (error) {
    logger.error('Failed to get sales summary', error);
    res.status(500).json({ error: 'Failed to get sales summary' });
  }
});

export default router;
