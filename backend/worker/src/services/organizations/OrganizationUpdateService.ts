import { BaseOrganizationService } from './BaseOrganizationService';
import { organizations, organizationMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { ServiceResponse, OrganizationUpdateData } from '../../types';

/**
 * Organization Update Service
 * 
 * Handles organization update operations with access control.
 */
export class OrganizationUpdateService extends BaseOrganizationService {
  /**
   * Update organization details
   * System Admin can update any organization
   * Organization Manager can update only their organization
   */
  async updateOrganization(
    organizationId: string,
    data: OrganizationUpdateData,
    userId: string,
    isSystemAdmin: boolean
  ): Promise<ServiceResponse<{ id: string; name: string }>> {
    try {
      // Validate organization ID
      if (!this.validateOrganizationId(organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
      }

      // Validate input
      if (!data.name && !data.description) {
        return this.error('At least one field must be provided', 'INVALID_INPUT');
      }

      if (data.name && data.name.trim().length === 0) {
        return this.error('Organization name cannot be empty', 'INVALID_INPUT');
      }

      // Check if organization exists
      const [org] = await this.db
        .select()
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

      if (!org) {
        return this.error('Organization not found', 'NOT_FOUND');
      }

      // Check access: System Admin or Organization Manager
      if (!isSystemAdmin) {
        const [membership] = await this.db
          .select()
          .from(organizationMembers)
          .where(
            and(
              eq(organizationMembers.organizationId, organizationId),
              eq(organizationMembers.userId, userId),
              eq(organizationMembers.organizationRoleCode, 1) // organization_manager
            )
          )
          .limit(1);

        if (!membership) {
          return this.error('Access denied: You must be an Organization Manager', 'FORBIDDEN');
        }
      }

      // Build update object
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name) {
        updateData.name = data.name.trim();
      }

      if (data.description !== undefined) {
        updateData.description = data.description?.trim() || null;
      }

      // Update organization
      const [updated] = await this.db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, organizationId))
        .returning({ id: organizations.id, name: organizations.name });

      return this.success(updated);
    } catch (error) {
      return this.handleError(error, 'Failed to update organization');
    }
  }
}
