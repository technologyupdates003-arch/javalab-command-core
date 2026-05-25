import { Router, Request, Response } from 'express';
import { getSubscriptionService } from '@/services/subscriptionService.js';
import { getQueueManager } from '@/services/queueManager.js';
import logger from '@/utils/logger.js';

const router = Router();

// Middleware to ensure subscription service is initialized
router.use(async (req: Request, res: Response, next) => {
  try {
    await getSubscriptionService();
    next();
  } catch (error) {
    logger.error('Failed to initialize subscription service', error);
    res.status(500).json({ error: 'Service initialization failed' });
  }
});

// ============ Plan Management ============

/**
 * POST /api/subscriptions/plans
 * Create a new subscription plan
 */
router.post('/plans', async (req: Request, res: Response) => {
  try {
    const { name, pricing, billingCycle, description, features } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || !pricing || !billingCycle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subscriptionService = await getSubscriptionService();
    const plan = await subscriptionService.createPlan(
      name,
      pricing,
      billingCycle,
      userId,
      description,
      features
    );

    res.status(201).json(plan);
  } catch (error) {
    logger.error('Error creating plan', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

/**
 * GET /api/subscriptions/plans
 * List all subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const subscriptionService = await getSubscriptionService();
    const plans = await subscriptionService.listPlans(status as string);

    res.json(plans);
  } catch (error) {
    logger.error('Error listing plans', error);
    res.status(500).json({ error: 'Failed to list plans' });
  }
});

/**
 * GET /api/subscriptions/plans/:planId
 * Get a specific subscription plan
 */
router.get('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const plan = await subscriptionService.getPlan(planId);

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    logger.error('Error fetching plan', error);
    res.status(500).json({ error: 'Failed to fetch plan' });
  }
});

/**
 * PUT /api/subscriptions/plans/:planId
 * Update a subscription plan
 */
router.put('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptionService = await getSubscriptionService();
    const plan = await subscriptionService.updatePlan(planId, req.body, userId);

    res.json(plan);
  } catch (error) {
    logger.error('Error updating plan', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// ============ Subscription Management ============

/**
 * POST /api/subscriptions
 * Create a new subscription
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { clientId, planId, billingCycle, startDate } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!clientId || !planId || !billingCycle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const subscriptionService = await getSubscriptionService();
    const subscription = await subscriptionService.createSubscription(
      clientId,
      planId,
      billingCycle,
      userId,
      startDate ? new Date(startDate) : undefined
    );

    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Error creating subscription', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * GET /api/subscriptions
 * List subscriptions with optional filtering
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { clientId, status } = req.query;
    const subscriptionService = await getSubscriptionService();
    const subscriptions = await subscriptionService.listSubscriptions(
      clientId as string,
      status as string
    );

    res.json(subscriptions);
  } catch (error) {
    logger.error('Error listing subscriptions', error);
    res.status(500).json({ error: 'Failed to list subscriptions' });
  }
});

/**
 * GET /api/subscriptions/:subscriptionId
 * Get a specific subscription
 */
router.get('/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const subscription = await subscriptionService.getSubscription(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    logger.error('Error fetching subscription', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * PUT /api/subscriptions/:subscriptionId
 * Update a subscription
 */
router.put('/:subscriptionId', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const subscription = await subscriptionService.updateSubscription(subscriptionId, req.body);

    res.json(subscription);
  } catch (error) {
    logger.error('Error updating subscription', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * POST /api/subscriptions/:subscriptionId/cancel
 * Cancel a subscription
 */
router.post('/:subscriptionId/cancel', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }

    const subscriptionService = await getSubscriptionService();
    const subscription = await subscriptionService.cancelSubscription(
      subscriptionId,
      reason,
      userId
    );

    res.json(subscription);
  } catch (error) {
    logger.error('Error cancelling subscription', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// ============ Plan Change with Proration ============

/**
 * POST /api/subscriptions/:subscriptionId/change-plan
 * Change subscription plan with proration calculation
 */
router.post('/:subscriptionId/change-plan', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { newPlanId, effectiveDate } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!newPlanId) {
      return res.status(400).json({ error: 'New plan ID is required' });
    }

    const subscriptionService = await getSubscriptionService();
    const result = await subscriptionService.changePlan(
      subscriptionId,
      newPlanId,
      userId,
      effectiveDate ? new Date(effectiveDate) : undefined
    );

    res.json(result);
  } catch (error) {
    logger.error('Error changing plan', error);
    res.status(500).json({ error: 'Failed to change plan' });
  }
});

// ============ Billing Management ============

/**
 * GET /api/subscriptions/:subscriptionId/billing-history
 * Get billing transaction history for a subscription
 */
router.get('/:subscriptionId/billing-history', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const transactions = await subscriptionService.listBillingTransactions(subscriptionId);

    res.json(transactions);
  } catch (error) {
    logger.error('Error fetching billing history', error);
    res.status(500).json({ error: 'Failed to fetch billing history' });
  }
});

/**
 * GET /api/subscriptions/billing/:transactionId
 * Get a specific billing transaction
 */
router.get('/billing/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const transaction = await subscriptionService.getBillingTransaction(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    logger.error('Error fetching transaction', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

/**
 * PUT /api/subscriptions/billing/:transactionId
 * Update a billing transaction
 */
router.put('/billing/:transactionId', async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const transaction = await subscriptionService.updateBillingTransaction(
      transactionId,
      req.body
    );

    res.json(transaction);
  } catch (error) {
    logger.error('Error updating transaction', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// ============ Renewal Reminders ============

/**
 * GET /api/subscriptions/:subscriptionId/renewal-reminders
 * Get renewal reminders for a subscription
 */
router.get('/:subscriptionId/renewal-reminders', async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const reminders = await subscriptionService.getRenewalReminders(subscriptionId);

    res.json(reminders);
  } catch (error) {
    logger.error('Error fetching renewal reminders', error);
    res.status(500).json({ error: 'Failed to fetch renewal reminders' });
  }
});

/**
 * GET /api/subscriptions/reminders/pending
 * Get all pending renewal reminders
 */
router.get('/reminders/pending', async (req: Request, res: Response) => {
  try {
    const subscriptionService = await getSubscriptionService();
    const reminders = await subscriptionService.getPendingRenewalReminders();

    res.json(reminders);
  } catch (error) {
    logger.error('Error fetching pending reminders', error);
    res.status(500).json({ error: 'Failed to fetch pending reminders' });
  }
});

/**
 * POST /api/subscriptions/reminders/:reminderId/send
 * Mark a renewal reminder as sent
 */
router.post('/reminders/:reminderId/send', async (req: Request, res: Response) => {
  try {
    const { reminderId } = req.params;
    const subscriptionService = await getSubscriptionService();
    const reminder = await subscriptionService.markReminderAsSent(reminderId);

    res.json(reminder);
  } catch (error) {
    logger.error('Error marking reminder as sent', error);
    res.status(500).json({ error: 'Failed to mark reminder as sent' });
  }
});

export default router;
