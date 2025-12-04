import { desc, count, sql, or } from 'drizzle-orm';
import { users } from '../../db/schema';
import { BaseUserService } from './BaseUserService';
import type { ServiceResponse, PaginatedResponse } from '../../types';
import type { User } from '../../types/models';

const MAX_SEARCH_RESULTS = 1000;

/**
 * User Query Service
 * 
 * Handles read operations for users:
 * - List users with pagination
 * - Search users with trigram fuzzy matching
 * - Get user by ID
 */
export class UserQueryService extends BaseUserService {
  /**
   * List all users with pagination and optional search
   * @param page - Page number
   * @param limit - Items per page
   * @param search - Optional search query (searches firstname, lastname, email)
   */
  async listUsers(page?: string | number, limit?: string | number, search?: string): Promise<ServiceResponse<PaginatedResponse<User>>> {
    try {
      // Normalize pagination parameters
      const { page: normalizedPage, limit: normalizedLimit } = this.normalizePaginationParams(page, limit);
      const offset = this.calculateOffset(normalizedPage, normalizedLimit);

      // If search query provided, use trigram search
      if (search && search.trim()) {
        return this.searchUsers(search.trim(), normalizedPage, normalizedLimit, offset);
      }

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
   * Search users using PostgreSQL trigram similarity
   * @private
   */
  private async searchUsers(
    query: string,
    page: number,
    limit: number,
    offset: number
  ): Promise<ServiceResponse<PaginatedResponse<User>>> {
    try {
      // Count total matching results (limited to MAX_SEARCH_RESULTS)
      const countQuery = this.db
        .select({ value: count() })
        .from(users)
        .where(
          or(
            sql`${users.firstname} % ${query}`,
            sql`${users.lastname} % ${query}`,
            sql`${users.email} % ${query}`
          )
        )
        .limit(MAX_SEARCH_RESULTS);

      const [{ value: totalCount }] = await countQuery;

      // Get paginated search results, ordered by best match
      const searchResults = await this.db
        .select({
          id: users.id,
          email: users.email,
          firstname: users.firstname,
          lastname: users.lastname,
          systemRoleCode: users.systemRoleCode,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(
          or(
            sql`${users.firstname} % ${query}`,
            sql`${users.lastname} % ${query}`,
            sql`${users.email} % ${query}`
          )
        )
        .orderBy(
          sql`LEAST(
            ${users.firstname} <-> ${query},
            ${users.lastname} <-> ${query},
            ${users.email} <-> ${query}
          )`
        )
        .limit(limit)
        .offset(offset);

      return this.success({
        items: searchResults,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: this.calculateTotalPages(totalCount, limit),
        },
      });
    } catch (error) {
      return this.handleError(error, 'UserQueryService.searchUsers');
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
