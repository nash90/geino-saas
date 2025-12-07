import { eq, and } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { AuthUser } from '../../types';
import { SystemRole, OrganizationRole, ProjectRole, TaskStatus } from '../../types/codeTypes';
import { organizationMembers, projects, projectMembers, tasks } from '../../db/schema';
import type { Task } from '../../types/models';

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
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) return true;

    // Check if user is Organization Manager of this organization
    const member = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
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
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) return true;

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
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
      )
    });

    if (orgMember) return true;

    // Check if user is Project Manager of this project
    const projectMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id),
        eq(projectMembers.projectRoleCode, ProjectRole.PROJECT_MANAGER.code)
      )
    });

    return !!projectMember;
  }

  /**
   * Check if user can create a task in a project
   * - System Admin: Can create any task
   * - Organization Manager: Can create any task in org projects
   * - Project Manager: Can create any task in their projects
   * - Genba User: Can create Hold status tasks only
   * - Geino User: Cannot create tasks
   */
  static async canCreateTask(
    db: DbClient,
    user: AuthUser,
    projectId: string,
    statusCode?: number
  ): Promise<boolean> {
    // System Admin can create any task
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) return true;

    // Get project to find its organization
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) return false;

    // Check if user is Organization Manager
    const orgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
      )
    });

    if (orgMember) return true;

    // Check project membership
    const projectMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id)
      )
    });

    if (!projectMember) return false;

    // Project Manager can create any task
    if (projectMember.projectRoleCode === ProjectRole.PROJECT_MANAGER.code) {
      return true;
    }

    // Genba User can only create Hold status tasks
    if (projectMember.projectRoleCode === ProjectRole.GENBA_USER.code) {
      return statusCode === TaskStatus.HOLD.code || statusCode === undefined;
    }

    // Geino User cannot create tasks
    return false;
  }

  /**
   * Check if user can edit a task
   * - System Admin: Can edit any task
   * - Organization Manager: Can edit any task in org projects
   * - Project Manager: Can edit any task in their projects
   * - Genba User: Can edit only their own tasks
   * - Geino User: Cannot edit tasks
   */
  static async canEditTask(
    db: DbClient,
    user: AuthUser,
    task: Task
  ): Promise<boolean> {
    // System Admin can edit any task
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) return true;

    // Get project to find its organization
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, task.projectId)
    });

    if (!project) return false;

    // Check if user is Organization Manager
    const orgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
      )
    });

    if (orgMember) return true;

    // Check project membership
    const projectMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, task.projectId),
        eq(projectMembers.userId, user.id)
      )
    });

    if (!projectMember) return false;

    // Project Manager can edit any task
    if (projectMember.projectRoleCode === ProjectRole.PROJECT_MANAGER.code) {
      return true;
    }

    // Genba User can edit only their own tasks
    if (projectMember.projectRoleCode === ProjectRole.GENBA_USER.code) {
      return task.createdBy === user.id;
    }

    // Geino User cannot edit tasks
    return false;
  }

  /**
   * Check if user can view tasks in a project
   * Any project member can view tasks
   */
  static async canViewTask(
    db: DbClient,
    user: AuthUser,
    projectId: string
  ): Promise<boolean> {
    // System Admin can view any task
    if (user.systemRoleCode === SystemRole.SYSTEM_ADMIN.code) return true;

    // Get project to find its organization
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId)
    });

    if (!project) return false;

    // Check if user is Organization Manager
    const orgMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, project.organizationId),
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
      )
    });

    if (orgMember) return true;

    // Check if user is a project member (any role)
    const projectMember = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, user.id)
      )
    });

    return !!projectMember;
  }
}
