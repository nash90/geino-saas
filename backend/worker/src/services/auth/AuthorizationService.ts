import { eq, and } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { AuthUser } from '../../types';
import { SystemRole, OrganizationRole, ProjectRole } from '../../types/codeTypes';
import { organizationMembers, projects, projectMembers } from '../../db/schema';

/**
 * Authorization service for checking user permissions
 * All methods assume user is authenticated (non-null)
 */
export class AuthorizationService {
  /**
   * Check if user is Organization Manager or above (System Admin or Org Manager of the organization)
   * Used for operations that require organization-level permissions
   */
  static async isOrganizationManagerOrAbove(
    db: DbClient,
    user: AuthUser,
    organizationId: string
  ): Promise<boolean> {
    // System Admin has access to everything
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN) return true;

    // Check if user is Organization Manager of this organization
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER)
      )
    });

    return !!member;
  }

  /**
   * Check if user is Project Manager or above for a specific project
   * Includes: System Admin, Organization Manager of the org, or Project Manager of the project
   */
  static async isProjectManagerOrAbove(
    db: DbClient,
    user: AuthUser,
    projectId: string
  ): Promise<boolean> {
    // System Admin has access to everything
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN) return true;

    // Get project to find its organization
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) return false;

    // Check if user is Organization Manager of the project's organization
    const orgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER)
      )
    });

    if (orgMember) return true;

    // Check if user is Project Manager of this project
    const projectMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id),
        eq(projectMembers.projectRoleCode, ProjectRole.PROJECT_MANAGER)
      )
    });

    return !!projectMember;
  }
}
