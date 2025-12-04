import { BaseOrganizationService } from './BaseOrganizationService';
import { organizations, organizationMembers, users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { ServiceResponse, OrganizationCreateData } from '../../types';

/**
 * Organization Create Service
 * 
 * Handles organization creation with manager assignments.
 */
export class OrganizationCreateService extends BaseOrganizationService {
  /**
   * Create a new organization with assigned managers
   */
  async createOrganization(
    data: OrganizationCreateData,
    createdBy: string
  ): Promise<ServiceResponse<{ id: string; name: string }>> {
    try {
      // Validate input
      if (!data.name || data.name.trim().length === 0) {
        return this.error('Organization name is required', 'INVALID_INPUT');
      }

      if (!data.managerIds || data.managerIds.length === 0) {
        return this.error('At least one Organization Manager is required', 'INVALID_INPUT');
      }

      // Validate all manager IDs
      for (const managerId of data.managerIds) {
        if (!this.validateOrganizationId(managerId)) {
          return this.error(`Invalid manager ID: ${managerId}`, 'INVALID_INPUT');
        }
      }

      // Verify all managers exist
      const existingUsers = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.managerIds[0])); // Check first one to ensure query works

      // Use transaction to ensure atomicity
      const result = await this.withTransaction(async (tx) => {
        // Create organization
        const [org] = await tx
          .insert(organizations)
          .values({
            name: data.name.trim(),
            description: data.description?.trim() || null,
            createdBy,
          })
          .returning({ id: organizations.id, name: organizations.name });

        // Create organization_members records for each manager
        const memberRecords = data.managerIds.map((managerId) => ({
          organizationId: org.id,
          userId: managerId,
          organizationRoleCode: 1, // organization_manager
        }));

        await tx.insert(organizationMembers).values(memberRecords);

        // TODO: US-20 - Emit 'organization.member_assigned' event to Cloudflare Queue
        // for each manager with { userId, organizationId, organizationName, organizationRoleCode }
        // Queue consumer will create in-app notifications and send email notifications

        return org;
      });

      return this.success(result);
    } catch (error) {
      return this.handleError(error, 'Failed to create organization');
    }
  }
}
