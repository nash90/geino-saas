import { desc, count } from 'drizzle-orm';
import { users } from '../../db/schema';
import { BaseUserService } from './BaseUserService';
import type { ServiceResponse, PaginatedResponse } from '../../types';
import type { User } from '../../types/models';

/**
 * User Query Service
 * 
 * Handles read operations for users:
 * - List users with pagination
 * - Get user by ID
 */
export class UserQueryService extends BaseUserService {
  /**
   * List all users with pagination
   */
  async listUsers(page?: string | number, limit?: string | number): Promise<ServiceResponse<PaginatedResponse<User>>> {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } = this.normalizePaginationParams(page, limit);
      const offset = this.calculateOffset(normalizedPage, normalizedLimit);

      // Get total count
      const [{ value: totalCount }] = await this.db.select({ value: count() }).from(users);

      // Get paginated users
      const usersList = await this.db.query.users.findMany({
        columns: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          systemRoleCode: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [desc(users.createdAt)],
        limit: normalizedLimit,
        offset,
      });

      return this.success({
        items: usersList,
        pagination: {
          page: normalizedPage,
          limit: normalizedLimit,
          total: totalCount,
          totalPages: this.calculateTotalPages(totalCount, normalizedLimit),
        },
      });
    } catch (error) {
      return this.handleError(error, 'UserQueryService.listUsers');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<ServiceResponse<User>> {
    try {
      // Validate user ID
      const validation = this.validationService.validateUserId(id);
      if (!validation.valid) {
        return this.error(validation.error!, 'INVALID_USER_ID');
      }

      const user = await this.db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, id),
        columns: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
          systemRoleCode: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        return this.error('User not found', 'USER_NOT_FOUND');
      }

      return this.success(user);
    } catch (error) {
      return this.handleError(error, 'UserQueryService.getUserById');
    }
  }
}
