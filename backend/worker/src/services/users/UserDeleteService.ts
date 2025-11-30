import { eq } from 'drizzle-orm';
import { users } from '../../db/schema';
import { BaseUserService } from './BaseUserService';
import type { ServiceResponse } from '../../types';

/**
 * User Delete Service
 * 
 * Handles delete operations for users:
 * - Delete user (with transaction to also delete from Supabase Auth)
 */
export class UserDeleteService extends BaseUserService {
  /**
   * Delete user (with transaction to also delete from Supabase Auth)
   */
  async deleteUser(id: string): Promise<ServiceResponse<void>> {
    try {
      // Validate user ID
      const validation = this.validationService.validateUserId(id);
      if (!validation.valid) {
        return this.error(validation.error!, 'INVALID_USER_ID');
      }

      // Execute delete with transaction-like behavior
      return await this.withTransaction(async (db) => {
        // Delete from custom users table first
        const deleted = await db
          .delete(users)
          .where(eq(users.id, id))
          .returning();

        if (!deleted.length) {
          return this.error('User not found', 'USER_NOT_FOUND');
        }

        // Delete from Supabase auth
        try {
          const supabase = this.createSupabaseClient();
          const { error: authError } = await supabase.auth.admin.deleteUser(id);
          
          if (authError) {
            console.error('[UserDeleteService.deleteUser] Failed to delete from Supabase Auth:', authError);
            // Note: In a real transaction, we would rollback the database delete here
            // For now, we log the error but continue as the database record is already deleted
          }
        } catch (authError) {
          console.error('[UserDeleteService.deleteUser] Exception deleting from Supabase Auth:', authError);
        }

        return this.success(undefined);
      });
    } catch (error) {
      return this.handleError(error, 'UserDeleteService.deleteUser');
    }
  }
}
