import { BaseOrganizationService } from './BaseOrganizationService';
import { organizationMembers, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { ServiceResponse, AddMemberData } from '../../types';
import { OrganizationRole } from '../../types/codeTypes';

/**
 * Organization Member Service
 * 
 * Handles adding and removing organization members (System Admin only).
 */
export class OrganizationMemberService extends BaseOrganizationService {
  /**
   * Add a member to an organization
   * System Admin only
   */
  async addMember(
    organizationId: string,
    data: AddMemberData
  ): Promise<ServiceResponse<{ id: string }>> {
    try {
      // Validate IDs
      if (!this.validateOrganizationId(organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
      }

      if (!this.validateOrganizationId(data.userId)) {
        return this.error('Invalid user ID', 'INVALID_INPUT');
      }

      // Validate role code
      if (!this.validateOrganizationRoleCode(data.organizationRoleCode)) {
        return this.error('Invalid organization role code', 'INVALID_INPUT');
      }

      // Check if user exists
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (!user) {
        return this.error('User not found', 'NOT_FOUND');
      }

      // Check if user is already a member
      const [existingMember] = await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, data.userId)
          )
        )
        .limit(1);

      if (existingMember) {
        return this.error('User is already a member of this organization', 'ALREADY_EXISTS');
      }

      // Add member
      const [member] = await this.db
        .insert(organizationMembers)
        .values({
          organizationId,
          userId: data.userId,
          organizationRoleCode: data.organizationRoleCode,
        })
        .returning({ id: organizationMembers.id });

      // TODO: US-20 - Emit 'organization.member_assigned' event to Cloudflare Queue
      // with { userId, organizationId, organizationName, organizationRoleCode }
      // Queue consumer will create in-app notification and send email notification

      return this.success(member);
    } catch (error) {
      return this.handleError(error, 'Failed to add organization member');
    }
  }

  /**
   * Remove a member from an organization
   * System Admin only
   */
  async removeMember(
    organizationId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate IDs
      if (!this.validateOrganizationId(organizationId)) {
        return this.error('Invalid organization ID', 'INVALID_INPUT');
      }

      if (!this.validateOrganizationId(userId)) {
        return this.error('Invalid user ID', 'INVALID_INPUT');
      }

      // Check if member exists
      const [member] = await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId)
          )
        )
        .limit(1);

      if (!member) {
        return this.error('User is not a member of this organization', 'NOT_FOUND');
      }

      // Remove member
      await this.db
        .delete(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId)
          )
        );

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to remove organization member');
    }
  }

  /**
   * Check if user has Organization Manager access to an organization
   * Returns true if user is System Admin OR Organization Manager of this organization
   */
  async hasOrganizationManagerAccess(
    organizationId: string,
    userId: string,
    isSystemAdmin: boolean
  ): Promise<boolean> {
    try {
      // System Admin has access to all organizations
      if (isSystemAdmin) {
        return true;
      }

      // Check if user is an Organization Manager of this organization
      const [member] = await this.db
        .select()
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER)
          )
        )
        .limit(1);

      return !!member;
    } catch (error) {
      console.error('Error checking organization manager access:', error);
      return false;
    }
  }
}
