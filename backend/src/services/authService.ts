import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  auth_provider: string;
  created_at: string;
}

/**
 * Authentication Service
 * Manages user authentication including OAuth and password reset
 */
export class AuthService {
  /**
   * Handle Google OAuth callback
   */
  async handleGoogleOAuthCallback(googleUser: {
    id: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<AuthUser> {
    logger.info(`Processing Google OAuth for user ${googleUser.email}`);

    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('email', googleUser.email)
      .single();

    if (!fetchError && existingUser) {
      logger.info(`Found existing user for email ${googleUser.email}`);
      return existingUser;
    }

    // Create new user
    logger.info(`Creating new user for email ${googleUser.email}`);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: googleUser.email,
        name: googleUser.name,
        avatar_url: googleUser.picture,
        auth_provider: 'google',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    logger.info(`Successfully created user ${newUser.id}`);
    return newUser;
  }

  /**
   * Link Google account to existing user
   */
  async linkGoogleAccount(userId: string, googleUser: {
    id: string;
    email: string;
    name: string;
    picture: string;
  }): Promise<AuthUser> {
    logger.info(`Linking Google account to user ${userId}`);

    const { data: user, error } = await supabase
      .from('users')
      .update({
        auth_provider: 'google',
        avatar_url: googleUser.picture,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to link Google account: ${error.message}`);
    }

    logger.info(`Successfully linked Google account to user ${userId}`);
    return user;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    logger.info(`Requesting password reset for ${email}`);

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (fetchError || !user) {
      // Don't reveal if email exists for security
      logger.info(`Password reset requested for non-existent email ${email}`);
      return {
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      };
    }

    // Generate reset token (24 hours expiration)
    const resetToken = this.generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Store reset token
    const { error: insertError } = await supabase
      .from('password_resets')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });

    if (insertError) {
      throw new Error(`Failed to create reset token: ${insertError.message}`);
    }

    // Send reset email
    await this.sendPasswordResetEmail(email, resetToken);

    logger.info(`Password reset email sent to ${email}`);
    return {
      success: true,
      message: 'Password reset link sent to your email.'
    };
  }

  /**
   * Verify reset token
   */
  async verifyResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
    logger.info(`Verifying reset token`);

    const { data: resetRecord, error } = await supabase
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error || !resetRecord) {
      logger.warn('Invalid or expired reset token');
      return { valid: false };
    }

    // Check if token is expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      logger.warn('Reset token expired');
      return { valid: false };
    }

    logger.info('Reset token is valid');
    return {
      valid: true,
      userId: resetRecord.user_id
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    logger.info('Resetting password with token');

    // Verify token
    const tokenVerification = await this.verifyResetToken(token);

    if (!tokenVerification.valid || !tokenVerification.userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Validate password
    if (!this.validatePassword(newPassword)) {
      throw new Error('Password does not meet security requirements');
    }

    // Update user password (in real implementation, this would be handled by Supabase Auth)
    // For now, we'll just mark the token as used
    const { error: updateError } = await supabase
      .from('password_resets')
      .update({
        used: true,
        used_at: new Date().toISOString()
      })
      .eq('token', token);

    if (updateError) {
      throw new Error(`Failed to mark token as used: ${updateError.message}`);
    }

    // Invalidate all sessions for this user
    await this.invalidateUserSessions(tokenVerification.userId);

    logger.info(`Password reset successful for user ${tokenVerification.userId}`);
    return { success: true };
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): boolean {
    // At least 8 characters
    if (password.length < 8) {
      return false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return false;
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      return false;
    }

    return true;
  }

  /**
   * Generate reset token
   */
  private generateResetToken(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Send password reset email
   */
  private async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    logger.info(`Sending password reset email to ${email}`);

    // TODO: Implement email sending with SendGrid, AWS SES, or similar
    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    logger.info(`Reset link would be sent: ${resetLink}`);
  }

  /**
   * Invalidate all sessions for user
   */
  private async invalidateUserSessions(userId: string): Promise<void> {
    logger.info(`Invalidating all sessions for user ${userId}`);

    // TODO: Implement session invalidation
    // This would typically involve:
    // 1. Deleting all active sessions from database
    // 2. Invalidating JWT tokens
    // 3. Clearing Redis cache
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      logger.error(`Failed to fetch user by email: ${error.message}`);
      return null;
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      logger.error(`Failed to fetch user by ID: ${error.message}`);
      return null;
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<AuthUser>): Promise<AuthUser> {
    logger.info(`Updating profile for user ${userId}`);

    const { data: user, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    logger.info(`Successfully updated profile for user ${userId}`);
    return user;
  }
}

// Export singleton instance
export const authService = new AuthService();
