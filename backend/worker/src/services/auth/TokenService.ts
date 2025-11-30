import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { BaseAuthService } from './BaseAuthService';
import type { ServiceResponse } from '../../types';
import type { User } from '../../types/models';
import type { TokenRefreshResponse } from '../../types/authTypes';

/**
 * Token Service
 * 
 * Handles token operations:
 * - Token refresh
 * - Token verification
 * - Logout (token revocation)
 */
export class TokenService extends BaseAuthService {
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<TokenRefreshResponse>> {
    try {
      if (!refreshToken) {
        return this.error('Refresh token is required', 'VALIDATION_ERROR');
      }

      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        console.error('[TokenService.refreshToken] Error:', error);
        return this.error(error?.message || 'Failed to refresh token', 'REFRESH_ERROR');
      }

      return this.success({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    } catch (error) {
      return this.handleError(error, 'TokenService.refreshToken');
    }
  }

  /**
   * Verify and get user from access token
   */
  async verifyToken(accessToken: string): Promise<ServiceResponse<User>> {
    try {
      if (!accessToken) {
        return this.error('Access token is required', 'VALIDATION_ERROR');
      }

      const { data: userData, error } = await this.supabase.auth.getUser(accessToken);

      if (error || !userData?.user) {
        return this.error('Invalid or expired token', 'INVALID_TOKEN');
      }

      // Fetch user profile from custom users table
      const userProfile = await this.db.query.users.findFirst({
        where: eq(users.id, userData.user.id)
      });

      if (!userProfile) {
        return this.error('User profile not found', 'USER_NOT_FOUND');
      }

      return this.success(userProfile);
    } catch (error) {
      return this.handleError(error, 'TokenService.verifyToken');
    }
  }

  /**
   * Sign out user (revoke refresh token)
   */
  async logout(accessToken: string): Promise<ServiceResponse<void>> {
    try {
      if (!accessToken) {
        return this.error('Access token is required', 'VALIDATION_ERROR');
      }

      const { error } = await this.supabase.auth.admin.signOut(accessToken);

      if (error) {
        console.error('[TokenService.logout] Error:', error);
        return this.error(error.message, 'LOGOUT_ERROR');
      }

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'TokenService.logout');
    }
  }
}
