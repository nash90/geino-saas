import { ServiceResponse } from '../base/BaseService';
import { BaseAuthService } from './BaseAuthService';

/**
 * Password Service
 * 
 * Handles password-related operations:
 * - Password reset request
 * - Password update with token
 */
export class PasswordService extends BaseAuthService {
  /**
   * Request password reset email
   */
  async resetPassword(email: string, appUrl: string): Promise<ServiceResponse<void>> {
    try {
      // Validate email
      const validation = this.validationService.validateEmail(email);
      if (!validation.valid) {
        return this.error(validation.error!, 'VALIDATION_ERROR');
      }

      // Send password reset email
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) {
        console.error('[PasswordService.resetPassword] Error:', error);
        return this.error(error.message, 'RESET_ERROR');
      }

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'PasswordService.resetPassword');
    }
  }

  /**
   * Update password with recovery token
   */
  async updatePassword(token: string, newPassword: string): Promise<ServiceResponse<void>> {
    try {
      // Validate password update data
      const validation = this.validationService.validatePasswordUpdateData({ 
        token, 
        password: newPassword 
      });
      if (!validation.valid) {
        return this.error(validation.error!, 'VALIDATION_ERROR');
      }

      // Verify the recovery token and get user info
      const { data: userData, error: verifyError } = await this.supabase.auth.getUser(token);

      if (verifyError || !userData?.user) {
        console.error('[PasswordService.updatePassword] Token Verification Error:', verifyError);
        return this.error('Invalid or expired token', 'INVALID_TOKEN');
      }

      // Update password using Admin API
      const { error: updateError } = await this.supabase.auth.admin.updateUserById(
        userData.user.id,
        { password: newPassword }
      );

      if (updateError) {
        console.error('[PasswordService.updatePassword] Update Error:', updateError);
        return this.error(updateError.message || 'Failed to update password', 'UPDATE_ERROR');
      }

      console.log('[PasswordService.updatePassword] Success:', { 
        userId: userData.user.id, 
        email: userData.user.email 
      });

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'PasswordService.updatePassword');
    }
  }
}
