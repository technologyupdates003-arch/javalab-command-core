import { Router, Request, Response } from 'express';
import { walletService } from '../services/walletService';
import { subscriptionService } from '../services/subscriptionService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/billing/wallet
 * Get wallet information for authenticated tenant
 */
router.get('/wallet', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const wallet = await walletService.getWallet(tenantId);
    const isLowBalance = await walletService.isLowBalance(tenantId);

    res.json({
      ...wallet,
      isLowBalance
    });
  } catch (error) {
    logger.error('Failed to get wallet', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

/**
 * POST /api/billing/wallet/topup
 * Top up wallet with payment
 */
router.post('/wallet/topup', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { amount, paymentMethod, referenceId } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method required' });
    }

    const transaction = await walletService.topUpWallet(
      tenantId,
      amount,
      paymentMethod,
      referenceId
    );

    res.json(transaction);
  } catch (error) {
    logger.error('Failed to top up wallet', error);
    res.status(500).json({ error: 'Failed to top up wallet' });
  }
});

/**
 * GET /api/billing/wallet/transactions
 * Get wallet transaction history
 */
router.get('/wallet/transactions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await walletService.getTransactionHistory(tenantId, limit, offset);

    res.json(result);
  } catch (error) {
    logger.error('Failed to get transaction history', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

/**
 * GET /api/billing/subscriptions
 * Get all subscriptions for tenant
 */
router.get('/subscriptions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await subscriptionService.getTenantSubscriptions(tenantId);

    res.json(subscriptions);
  } catch (error) {
    logger.error('Failed to get subscriptions', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

/**
 * GET /api/billing/subscriptions/active
 * Get active subscriptions for tenant
 */
router.get('/subscriptions/active', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await subscriptionService.getActiveSubscriptions(tenantId);

    res.json(subscriptions);
  } catch (error) {
    logger.error('Failed to get active subscriptions', error);
    res.status(500).json({ error: 'Failed to get active subscriptions' });
  }
});

/**
 * GET /api/billing/subscriptions/:id
 * Get subscription by ID
 */
router.get('/subscriptions/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const subscriptionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Verify subscription belongs to tenant
    if (subscription.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(subscription);
  } catch (error) {
    logger.error('Failed to get subscription', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

/**
 * POST /api/billing/subscriptions
 * Create new subscription
 */
router.post('/subscriptions', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const { productId, amount, billingCycle, currency } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productId || !amount) {
      return res.status(400).json({ error: 'Product ID and amount required' });
    }

    const subscription = await subscriptionService.createSubscription(
      tenantId,
      productId,
      amount,
      billingCycle || 'monthly',
      currency || 'KES'
    );

    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Failed to create subscription', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * POST /api/billing/subscriptions/:id/cancel
 * Cancel subscription
 */
router.post('/subscriptions/:id/cancel', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const subscriptionId = req.params.id;
    const { reason } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Verify subscription belongs to tenant
    if (subscription.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const result = await subscriptionService.cancelSubscription(
      subscriptionId,
      reason || 'User requested cancellation'
    );

    res.json(result);
  } catch (error) {
    logger.error('Failed to cancel subscription', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * POST /api/billing/subscriptions/:id/pause
 * Pause subscription
 */
router.post('/subscriptions/:id/pause', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const subscriptionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Verify subscription belongs to tenant
    if (subscription.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSubscription = await subscriptionService.pauseSubscription(subscriptionId);

    res.json(updatedSubscription);
  } catch (error) {
    logger.error('Failed to pause subscription', error);
    res.status(500).json({ error: 'Failed to pause subscription' });
  }
});

/**
 * POST /api/billing/subscriptions/:id/resume
 * Resume subscription
 */
router.post('/subscriptions/:id/resume', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const subscriptionId = req.params.id;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Verify subscription belongs to tenant
    if (subscription.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSubscription = await subscriptionService.resumeSubscription(subscriptionId);

    res.json(updatedSubscription);
  } catch (error) {
    logger.error('Failed to resume subscription', error);
    res.status(500).json({ error: 'Failed to resume subscription' });
  }
});

/**
 * PUT /api/billing/subscriptions/:id/plan
 * Change subscription plan
 */
router.put('/subscriptions/:id/plan', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user?.tenant_id;
    const subscriptionId = req.params.id;
    const { amount, billingCycle } = req.body;

    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!amount || !billingCycle) {
      return res.status(400).json({ error: 'Amount and billing cycle required' });
    }

    const subscription = await subscriptionService.getSubscription(subscriptionId);

    // Verify subscription belongs to tenant
    if (subscription.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedSubscription = await subscriptionService.changePlan(
      subscriptionId,
      amount,
      billingCycle
    );

    res.json(updatedSubscription);
  } catch (error) {
    logger.error('Failed to change plan', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

export default router;
