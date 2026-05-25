import { Router, Request, Response } from 'express';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/auth/google/callback
 * Handle Google OAuth callback
 */
router.post('/google/callback', async (req: Request, res: Response) => {
  try {
    const { googleUser } = req.body;

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Invalid Google user data' });
    }

    const user = await authService.handleGoogleOAuthCallback(googleUser);

    res.json({
      user,
      message: 'Successfully authenticated with Google'
    });
  } catch (error) {
    logger.error('Failed to handle Google OAuth callback', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

/**
 * POST /api/auth/google/link
 * Link Google account to existing user
 */
router.post('/google/link', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { googleUser } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Invalid Google user data' });
    }

    const user = await authService.linkGoogleAccount(userId, googleUser);

    res.json({
      user,
      message: 'Successfully linked Google account'
    });
  } catch (error) {
    logger.error('Failed to link Google account', error);
    res.status(500).json({ error: 'Failed to link Google account' });
  }
});

/**
 * POST /api/auth/password-reset/request
 * Request password reset
 */
router.post('/password-reset/request', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const result = await authService.requestPasswordReset(email);

    res.json(result);
  } catch (error) {
    logger.error('Failed to request password reset', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

/**
 * POST /api/auth/password-reset/verify
 * Verify reset token
 */
router.post('/password-reset/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const result = await authService.verifyResetToken(token);

    res.json(result);
  } catch (error) {
    logger.error('Failed to verify reset token', error);
    res.status(500).json({ error: 'Failed to verify reset token' });
  }
});

/**
 * POST /api/auth/password-reset/confirm
 * Reset password with token
 */
router.post('/password-reset/confirm', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password required' });
    }

    const result = await authService.resetPassword(token, newPassword);

    res.json(result);
  } catch (error) {
    logger.error('Failed to reset password', error);
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/auth/user
 * Get current authenticated user
 */
router.get('/user', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * PUT /api/auth/user
 * Update user profile
 */
router.put('/user', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, avatar_url } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await authService.updateUserProfile(userId, {
      name,
      avatar_url
    });

    res.json(user);
  } catch (error) {
    logger.error('Failed to update user profile', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
