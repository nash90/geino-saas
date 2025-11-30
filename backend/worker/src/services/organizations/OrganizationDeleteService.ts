import { BaseOrganizationService } from './BaseOrganizationService';
import { organizations } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';

/**
 * Organization Delete Service
 * 
 * Handles organization deletion (System Admin only).
 */
export class OrganizationDeleteService extends BaseOrganizationService {
  /**
   * Delete organization by ID
   * Only System Admin can delete organizations
   * CASCADE will automatically delete organization_members
   */
  async deleteOrganization(
    organizationId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate organization ID
      if (!this.validateOrganizationId(organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
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

      // Delete organization (CASCADE will delete members)
      await this.db
        .delete(organizations)
        .where(eq(organizations.id, organizationId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete organization');
    }
  }
}
