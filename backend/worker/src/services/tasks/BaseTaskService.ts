import { eq, and, sql } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';
import { tasks, projectMembers, projects, organizationMembers, users } from '../../db/schema';
import {
  VALID_TASK_STATUS_CODES,
  VALID_TASK_PRIORITY_CODES,
  VALID_TASK_TYPE_CODES,
  ProjectRole,
  SystemRole,
  OrganizationRole
} from '../../types/codeTypes';

/**
 * Base Task Service
 *
 * Provides common utilities for task services:
 * - Database access
 * - Environment variables
 * - Error handling
 * - Response formatting
 * - Task-specific validation helpers
 * - Permission checking
 */
export abstract class BaseTaskService {
  protected db: DbClient;
  protected env: Env;

  constructor(db: DbClient, env: Env) {
    this.db = db;
    this.env = env;
  }

  /**
   * Create success response
   */
  protected success<T>(data: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    };
  }

  /**
   * Create error response
   */
  protected error(error: string, code?: string): ServiceResponse<never> {
    return {
      success: false,
      error,
      code,
    };
  }

  /**
   * Handle unexpected errors
   */
  protected handleError(error: unknown, context: string): ServiceResponse<never> {
    console.error(`[${context}] Error:`, error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return this.error(message, 'INTERNAL_ERROR');
  }

  /**
   * Validate UUID format
   */
  protected validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Validate task status code
   * 1: hold, 2: todo, 3: in_progress, 4: done, 5: waiting
   */
  protected validateTaskStatusCode(code: number): boolean {
    return VALID_TASK_STATUS_CODES.includes(code);
  }

  /**
   * Validate task type code
   * 1: type_a, 2: type_b
   */
  protected validateTaskTypeCode(code: number): boolean {
    return VALID_TASK_TYPE_CODES.includes(code);
  }

  /**
   * Validate task priority code
   * 1: low, 2: medium, 3: high, 4: urgent
   */
  protected validateTaskPriorityCode(code: number): boolean {
    return VALID_TASK_PRIORITY_CODES.includes(code);
  }

  /**
   * Validate deadline is a future date
   */
  protected validateDeadline(date: Date): boolean {
    const now = new Date();
    return date > now;
  }

  /**
   * Check if user has access to a task (via project membership, org manager, or system admin)
   * Returns the task and project member record if access granted
   *
   * Access Rules:
   * - System Admin: Has access to all tasks (gets PM privileges)
   * - Organization Manager: Has access to all tasks in their organizations (gets PM privileges)
   * - Project Members: Has access to tasks in their projects
   *
   * Performance: Optimized with single JOIN query - O(log n) complexity
   * Scalability: Performs consistently even with millions of users due to indexed columns
   */
  protected async canUserAccessTask(
    userId: string,
    taskId: string
  ): Promise<{ hasAccess: boolean; task?: any; projectMember?: any }> {
    try {
      // Single optimized query with LEFT JOINs to get all access information
      // Direct parameter binding (no prepared statements for serverless)
      const result = await this.db
        .select({
          // Task details
          task: tasks,
          // User system role
          userSystemRole: users.systemRoleCode,
          // Organization manager role (if exists)
          orgManagerRole: organizationMembers.organizationRoleCode,
          // Project member role (if exists)
          projectMemberRole: projectMembers.projectRoleCode,
        })
        .from(tasks)
        .leftJoin(users, eq(users.id, userId))
        .leftJoin(projects, eq(projects.id, tasks.projectId))
        .leftJoin(
          organizationMembers,
          and(
            eq(organizationMembers.organizationId, projects.organizationId),
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationRoleCode, OrganizationRole.ORGANIZATION_MANAGER.code)
          )
        )
        .leftJoin(
          projectMembers,
          and(
            eq(projectMembers.projectId, tasks.projectId),
            eq(projectMembers.userId, userId)
          )
        )
        .where(eq(tasks.id, taskId));

      // No results means task doesn't exist
      if (!result || result.length === 0) {
        return { hasAccess: false };
      }

      const row = result[0];
      const task = row.task;

      // Check access in order of priority: System Admin > Org Manager > Project Member

      // 1. System Admin has access to all tasks with PM privileges
      if (row.userSystemRole === SystemRole.SYSTEM_ADMIN.code) {
        return {
          hasAccess: true,
          task,
          projectMember: { projectRoleCode: ProjectRole.PROJECT_MANAGER.code }
        };
      }

      // 2. Organization Manager has access with PM privileges
      if (row.orgManagerRole === OrganizationRole.ORGANIZATION_MANAGER.code) {
        return {
          hasAccess: true,
          task,
          projectMember: { projectRoleCode: ProjectRole.PROJECT_MANAGER.code }
        };
      }

      // 3. Project Member has access with their assigned role
      if (row.projectMemberRole !== null && row.projectMemberRole !== undefined) {
        return {
          hasAccess: true,
          task,
          projectMember: { projectRoleCode: row.projectMemberRole }
        };
      }

      // No access
      return { hasAccess: false, task };
    } catch (error) {
      console.error('[canUserAccessTask] Error:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Check if user can edit a task
   * Rules:
   * - Project Managers can edit all tasks in their projects
   * - Genba Users can only edit tasks they created
   * - Geino Users cannot edit tasks
   */
  protected async canUserEditTask(
    userId: string,
    taskId: string
  ): Promise<{ canEdit: boolean; task?: any; projectMember?: any }> {
    const accessCheck = await this.canUserAccessTask(userId, taskId);

    if (!accessCheck.hasAccess || !accessCheck.task || !accessCheck.projectMember) {
      return { canEdit: false };
    }

    const { task, projectMember } = accessCheck;

    // Project Managers can edit any task
    if (projectMember.projectRoleCode === ProjectRole.PROJECT_MANAGER.code) {
      return { canEdit: true, task, projectMember };
    }

    // Genba Users can edit only their own tasks
    if (projectMember.projectRoleCode === ProjectRole.GENBA_USER.code && task.createdBy === userId) {
      return { canEdit: true, task, projectMember };
    }

    // Geino Users cannot edit tasks
    return { canEdit: false, task, projectMember };
  }

  /**
   * Get current timestamp
   */
  protected getCurrentTimestamp(): Date {
    return new Date();
  }

  /**
   * Normalize pagination parameters
   */
  protected normalizePaginationParams(page: number, limit: number) {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.min(Math.max(1, limit), 100);
    return { page: normalizedPage, limit: normalizedLimit };
  }

  /**
   * Calculate pagination offset
   */
  protected calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
