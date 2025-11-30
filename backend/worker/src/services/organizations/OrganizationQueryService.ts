import { BaseOrganizationService } from './BaseOrganizationService';
import { organizations, organizationMembers, users } from '../../db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
  OrganizationListItem,
  OrganizationWithMembers,
  OrganizationMemberWithUser,
} from '../../types';

/**
 * Organization Query Service
 * 
 * Handles organization read operations with pagination and filtering.
 */
export class OrganizationQueryService extends BaseOrganizationService {
  /**
   * List organizations with pagination
   * System Admin sees all organizations
   * Organization Managers see only their organizations
   */
  async listOrganizations(
    params: PaginationParams,
    userId: string,
    isSystemAdmin: boolean
  ): Promise<ServiceResponse<PaginatedResponse<OrganizationListItem>>> {
    try {
      const normalizedParams = this.normalizePaginationParams(params.page, params.limit);
      const limit = normalizedParams.limit;
      const offset = this.calculateOffset(normalizedParams.page, normalizedParams.limit);

      // Build base query
      const baseQuery = this.db.select({
        id: organizations.id,
        name: organizations.name,
        description: organizations.description,
        createdAt: organizations.createdAt,
      }).from(organizations);

      const baseCountQuery = this.db.select({ count: sql<number>`count(*)` }).from(organizations);

      // Apply filters based on user role
      let items;
      let total;

      if (!isSystemAdmin) {
        // Organization Manager: only their organizations
        const [countResult, queryResult] = await Promise.all([
          baseCountQuery
            .innerJoin(organizationMembers, eq(organizationMembers.organizationId, organizations.id))
            .where(eq(organizationMembers.userId, userId)),
          baseQuery
            .innerJoin(organizationMembers, eq(organizationMembers.organizationId, organizations.id))
            .where(eq(organizationMembers.userId, userId))
            .orderBy(desc(organizations.createdAt))
            .limit(limit)
            .offset(offset)
        ]);
        total = Number(countResult[0]?.count || 0);
        items = queryResult as OrganizationListItem[];
      } else {
        // System Admin: all organizations
        const [countResult, queryResult] = await Promise.all([
          baseCountQuery,
          baseQuery
            .orderBy(desc(organizations.createdAt))
            .limit(limit)
            .offset(offset)
        ]);
        total = Number(countResult[0]?.count || 0);
        items = queryResult as OrganizationListItem[];
      }



      return this.success({
        items,
        pagination: {
          page: normalizedParams.page,
          limit: normalizedParams.limit,
          total,
          totalPages: Math.ceil(total / normalizedParams.limit),
        },
      });
    } catch (error) {
      return this.handleError(error, 'Failed to list organizations');
    }
  }

  /**
   * Get organization by ID with members
   */
  async getOrganizationById(
    organizationId: string,
    userId: string,
    isSystemAdmin: boolean
  ): Promise<ServiceResponse<OrganizationWithMembers>> {
    try {
      // Validate organization ID
      if (!this.validateOrganizationId(organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
      }

      // Fetch organization
      const [org] = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!org) {
        return this.error('Organization not found', 'NOT_FOUND');
      }

      // Check access: System Admin or Organization Member
      if (!isSystemAdmin) {
        const [membership] = await this.db
          .select()
          .from(organizationMembers)
          .where(
            eq(organizationMembers.organizationId, organizationId) &&
            eq(organizationMembers.userId, userId)
          )
          .limit(1);

        if (!membership) {
          return this.error('Access denied', 'FORBIDDEN');
        }
      }

      // Fetch organization members with user details
      const members = await this.db
        .select({
          id: organizationMembers.id,
          organizationId: organizationMembers.organizationId,
          userId: organizationMembers.userId,
          organizationRoleCode: organizationMembers.organizationRoleCode,
          createdAt: organizationMembers.createdAt,
          user: {
            id: users.id,
            email: users.email,
            firstname: users.firstname,
            lastname: users.lastname,
          },
        })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(eq(organizationMembers.organizationId, organizationId));

      const result: OrganizationWithMembers = {
        ...org,
        members: members as OrganizationMemberWithUser[],
      };

      return this.success(result);
    } catch (error) {
      return this.handleError(error, 'Failed to get organization');
    }
  }
}
