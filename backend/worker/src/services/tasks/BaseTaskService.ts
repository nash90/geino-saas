import { eq, and } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env, ServiceResponse } from '../../types';
import { tasks, projectMembers } from '../../db/schema';
import {
  VALID_TASK_STATUS_CODES,
  VALID_TASK_PRIORITY_CODES,
  VALID_TASK_TYPE_CODES
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
   * Check if user has access to a task (via project membership)
   * Returns the task and project member record if access granted
   */
  protected async canUserAccessTask(
    userId: string,
    taskId: string
  ): Promise<{ hasAccess: boolean; task?: any; projectMember?: any }> {
    try {
      // Fetch task
      const task = await this.db.query.tasks.findFirst({
        where: eq(tasks.id, taskId),
      });

      if (!task) {
        return { hasAccess: false };
      }

      // Check if user is a member of the task's project
      const projectMember = await this.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, task.projectId),
          eq(projectMembers.userId, userId)
        ),
      });

      if (!projectMember) {
        return { hasAccess: false, task };
      }

      return { hasAccess: true, task, projectMember };
    } catch (error) {
      console.error('[canUserAccessTask] Error:', error);
      return { hasAccess: false };
    }
  }

  /**
   * Check if user can edit a task
   * Rules:
   * - Project Managers (role 1) can edit all tasks in their projects
   * - Genba Users (role 3) can only edit tasks they created
   * - Geino Users (role 2) cannot edit tasks
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
    if (projectMember.projectRoleCode === 1) {
      return { canEdit: true, task, projectMember };
    }

    // Genba Users can edit only their own tasks
    if (projectMember.projectRoleCode === 3 && task.createdBy === userId) {
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
