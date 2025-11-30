import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { ServiceResponse } from '../base/BaseService';
import { BaseUserService } from './BaseUserService';
import type { User } from '../../types/models';
import type { UserProfileUpdateData } from '../../types/userTypes';

/**
 * User Update Service
 * 
 * Handles update operations for users:
 * - Update user role
 * - Update user profile
 */
export class UserUpdateService extends BaseUserService {
  /**
   * Update user role
   */
  async updateUserRole(id: string, systemRoleCode: number | null): Promise<ServiceResponse<User>> {
    try {
      // Validate user ID
      const idValidation = this.validationService.validateUserId(id);
      if (!idValidation.valid) {
        return this.error(idValidation.error!, 'INVALID_USER_ID');
      }

      // Validate role code
      const roleValidation = this.validationService.validateSystemRoleCode(systemRoleCode);
      if (!roleValidation.valid) {
        return this.error(roleValidation.error!, 'INVALID_ROLE_CODE');
      }

      // Update user
      const updatedUser = await this.db
        .update(users)
        .set({
          systemRoleCode,
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser.length) {
        return this.error('User not found', 'USER_NOT_FOUND');
      }

      return this.success(updatedUser[0]);
    } catch (error) {
      return this.handleError(error, 'UserUpdateService.updateUserRole');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    id: string,
    data: UserProfileUpdateData
  ): Promise<ServiceResponse<User>> {
    try {
      // Validate user ID
      const validation = this.validationService.validateUserId(id);
      if (!validation.valid) {
        return this.error(validation.error!, 'INVALID_USER_ID');
      }

      // Validate profile data
      if (data.firstname !== undefined && data.firstname.trim().length < 1) {
        return this.error('First name must not be empty', 'INVALID_FIRSTNAME');
      }

      if (data.lastname !== undefined && data.lastname.trim().length < 1) {
        return this.error('Last name must not be empty', 'INVALID_LASTNAME');
      }

      // Update user
      const updatedUser = await this.db
        .update(users)
        .set({
          ...data,
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser.length) {
        return this.error('User not found', 'USER_NOT_FOUND');
      }

      return this.success(updatedUser[0]);
    } catch (error) {
      return this.handleError(error, 'UserUpdateService.updateUserProfile');
    }
  }
}
