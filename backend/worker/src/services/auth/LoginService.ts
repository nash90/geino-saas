import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { ServiceResponse } from '../base/BaseService';
import { BaseAuthService } from './BaseAuthService';
import type { LoginData, LoginResponse } from '../../types/authTypes';

/**
 * Login Service
 * 
 * Handles user authentication:
 * - Validates login credentials
 * - Authenticates with Supabase
 * - Fetches user profile
 * - Returns tokens
 */
export class LoginService extends BaseAuthService {
  /**
   * Login user with email and password
   */
  async login(data: LoginData): Promise<ServiceResponse<LoginResponse>> {
    try {
      // Validate login data
      const validation = this.validationService.validateLoginData(data);
      if (!validation.valid) {
        return this.error(validation.error!, 'VALIDATION_ERROR');
      }

      // Sign in with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError || !authData.user || !authData.session) {
        console.error('[LoginService.login] Auth Error:', authError);
        return this.error(authError?.message || 'Invalid credentials', 'INVALID_CREDENTIALS');
      }

      // Fetch user profile from custom users table
      const userProfile = await this.db.query.users.findFirst({
        where: eq(users.id, authData.user.id)
      });

      if (!userProfile) {
        return this.error('User profile not found', 'USER_NOT_FOUND');
      }

      return this.success({
        user: userProfile,
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      });
    } catch (error) {
      return this.handleError(error, 'LoginService.login');
    }
  }
}
