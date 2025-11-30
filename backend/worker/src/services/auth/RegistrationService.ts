import { users } from '../../db/schema';
import { ServiceResponse } from '../base/BaseService';
import { BaseAuthService } from './BaseAuthService';
import type { User } from '../../types/models';
import type { RegistrationData } from '../../types/authTypes';

/**
 * Registration Service
 * 
 * Handles user registration:
 * - Validates registration data
 * - Creates Supabase auth user
 * - Creates user profile in database
 * - Handles rollback on failure
 */
export class RegistrationService extends BaseAuthService {
  /**
   * Register a new user
   * Creates both Supabase auth user and custom users table record
   */
  async register(data: RegistrationData): Promise<ServiceResponse<User>> {
    try {
      // Validate registration data
      const validation = this.validationService.validateRegistrationData(data);
      if (!validation.valid) {
        return this.error(validation.error!, 'VALIDATION_ERROR');
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { 
            firstname: data.firstname, 
            lastname: data.lastname 
          }
        }
      });

      if (authError || !authData.user) {
        console.error('[RegistrationService.register] Supabase Auth Error:', authError);
        return this.error(authError?.message || 'Registration failed', 'AUTH_ERROR');
      }

      // Create user profile in custom users table
      try {
        const [newUser] = await this.db.insert(users).values({
          id: authData.user.id,
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          systemRoleCode: null,
        }).returning();

        return this.success(newUser);
      } catch (dbError) {
        console.error('[RegistrationService.register] Database Error:', dbError);
        
        // Rollback: delete Supabase auth user
        try {
          await this.supabase.auth.admin.deleteUser(authData.user.id);
        } catch (rollbackError) {
          console.error('[RegistrationService.register] Rollback Error:', rollbackError);
        }
        
        return this.error('Failed to create user profile', 'DATABASE_ERROR');
      }
    } catch (error) {
      return this.handleError(error, 'RegistrationService.register');
    }
  }
}
