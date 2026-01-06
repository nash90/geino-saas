/**
 * Task Command Validation Service
 * 
 * Handles all validation logic for task create/update operations.
 * Separates validation concerns from business logic in TaskCommandService.
 */

import { projectMembers } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { DbClient } from '../../db/client';
import type { Env } from '../../types';
import { TaskStatus, ProjectRole } from '../../types/codeTypes';

// Simple error response for validation
interface ValidationError {
  error: string;
  code: string;
}

export interface CreateTaskData {
  projectId: string;
  title: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: Date;
  createdBy: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  statusCode?: number;
  typeCode?: number;
  priorityCode?: number;
  assignedTo?: string;
  deadline?: Date;
}

export class TaskCommandValidationService {
  constructor(
    private db: DbClient,
    private env: Env
  ) {}

  /**
   * Helper: Validate UUID format
   */
  private validateUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  /**
   * Helper: Validate task status code
   */
  private validateTaskStatusCode(statusCode: number): boolean {
    const validCodes = [1, 2, 3, 4, 5]; // Hold, Todo, InProgress, Done, Waiting
    return validCodes.includes(statusCode);
  }

  /**
   * Helper: Validate task type code
   */
  private validateTaskTypeCode(typeCode: number): boolean {
    const validCodes = [1, 2]; // Type A, Type B
    return validCodes.includes(typeCode);
  }

  /**
   * Helper: Validate task priority code
   */
  private validateTaskPriorityCode(priorityCode: number): boolean {
    const validCodes = [1, 2, 3, 4]; // Low, Medium, High, Urgent
    return validCodes.includes(priorityCode);
  }

  /**
   * Helper: Validate deadline is a future date
   */
  private validateDeadline(deadline: Date): boolean {
    const now = new Date();
    return deadline > now;
  }

  /**
   * Create error response helper
   */
  private error(message: string, code: string): ValidationError {
    return { error: message, code };
  }

  /**
   * Validate task title
   */
  validateTitle(title: string | undefined, required: boolean = true): ValidationError | null {
    if (required && (!title || title.trim().length === 0)) {
      return this.error('Task title is required', 'INVALID_INPUT');
    }

    if (title && title.length > 500) {
      return this.error('Task title must be 500 characters or less', 'INVALID_INPUT');
    }

    return null; // No error
  }

  /**
   * Validate project ID format
   */
  validateProjectId(projectId: string): ValidationError | null {
    if (!this.validateUUID(projectId)) {
      return this.error('Invalid project ID', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate task ID format
   */
  validateTaskId(taskId: string): ValidationError | null {
    if (!this.validateUUID(taskId)) {
      return this.error('Invalid task ID', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate status code
   */
  validateStatusCode(statusCode: number | undefined): ValidationError | null {
    if (statusCode === undefined) return null;

    if (!this.validateTaskStatusCode(statusCode)) {
      return this.error('Invalid status code', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate type code
   */
  validateTypeCode(typeCode: number | undefined): ValidationError | null {
    if (typeCode === undefined) return null;

    if (!this.validateTaskTypeCode(typeCode)) {
      return this.error('Invalid task type code', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate priority code
   */
  validatePriorityCode(priorityCode: number | undefined): ValidationError | null {
    if (priorityCode === undefined) return null;

    if (!this.validateTaskPriorityCode(priorityCode)) {
      return this.error('Invalid priority code', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate deadline
   */
  validateDeadlineDate(deadline: Date | undefined): ValidationError | null {
    if (!deadline) return null;

    if (!this.validateDeadline(deadline)) {
      return this.error('Deadline must be a future date', 'INVALID_INPUT');
    }
    return null;
  }

  /**
   * Validate assignee is a project member
   */
  async validateAssignee(
    assigneeUserId: string | undefined,
    projectId: string
  ): Promise<ValidationError | null> {
    if (!assigneeUserId) return null;

    if (!this.validateUUID(assigneeUserId)) {
      return this.error('Invalid assignee user ID', 'INVALID_INPUT');
    }

    const assigneeMember = await this.db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, assigneeUserId)
      ),
    });

    if (!assigneeMember) {
      return this.error('Assignee must be a member of the project', 'INVALID_INPUT');
    }

    return null; // No error
  }

  /**
   * Validate Genba user can create task with this status
   */
  validateGenbaUserCreateStatus(
    userRoleCode: number,
    statusCode: number
  ): ValidationError | null {
    if (userRoleCode === ProjectRole.GENBA_USER.code && statusCode !== TaskStatus.HOLD.code) {
      return this.error('Genba users can only create tasks with Hold status', 'FORBIDDEN');
    }
    return null;
  }

  /**
   * Validate Genba user cannot change task status
   */
  validateGenbaUserStatusChange(
    userRoleCode: number | undefined,
    oldStatus: number,
    newStatus: number | undefined
  ): ValidationError | null {
    if (
      newStatus !== undefined &&
      userRoleCode === ProjectRole.GENBA_USER.code &&
      newStatus !== oldStatus
    ) {
      return this.error(
        'Genba users cannot change task status. Only Project Managers can change task status.',
        'FORBIDDEN'
      );
    }
    return null;
  }

  /**
   * Validate all fields for task creation
   */
  async validateCreateTaskData(
    data: CreateTaskData,
    userRoleCode: number
  ): Promise<ValidationError | null> {
    // Validate project ID
    const projectIdError = this.validateProjectId(data.projectId);
    if (projectIdError) return projectIdError;

    // Validate title
    const titleError = this.validateTitle(data.title, true);
    if (titleError) return titleError;

    // Validate status code (default to HOLD if not provided)
    const statusCode = data.statusCode !== undefined ? data.statusCode : TaskStatus.HOLD.code;
    const statusError = this.validateStatusCode(statusCode);
    if (statusError) return statusError;

    // Genba Users can only create Hold status tasks
    const genbaStatusError = this.validateGenbaUserCreateStatus(userRoleCode, statusCode);
    if (genbaStatusError) return genbaStatusError;

    // Validate type code if provided
    const typeError = this.validateTypeCode(data.typeCode);
    if (typeError) return typeError;

    // Validate priority code if provided
    const priorityError = this.validatePriorityCode(data.priorityCode);
    if (priorityError) return priorityError;

    // Validate deadline if provided
    const deadlineError = this.validateDeadlineDate(data.deadline);
    if (deadlineError) return deadlineError;

    // Validate assignee if provided
    const assigneeError = await this.validateAssignee(data.assignedTo, data.projectId);
    if (assigneeError) return assigneeError;

    return null; // All validations passed
  }

  /**
   * Validate all fields for task update
   */
  async validateUpdateTaskData(
    data: UpdateTaskData,
    projectId: string,
    currentStatus: number,
    userRoleCode: number | undefined
  ): Promise<ValidationError | null> {
    // Validate title if provided
    if (data.title !== undefined) {
      const titleError = this.validateTitle(data.title, false);
      if (titleError) return titleError;

      // Check if title is empty after trim
      if (data.title.trim().length === 0) {
        return this.error('Task title cannot be empty', 'INVALID_INPUT');
      }
    }

    // Validate status code if provided
    const statusError = this.validateStatusCode(data.statusCode);
    if (statusError) return statusError;

    // Genba Users cannot change task status
    const genbaStatusError = this.validateGenbaUserStatusChange(
      userRoleCode,
      currentStatus,
      data.statusCode
    );
    if (genbaStatusError) return genbaStatusError;

    // Validate type code if provided
    const typeError = this.validateTypeCode(data.typeCode);
    if (typeError) return typeError;

    // Validate priority code if provided
    const priorityError = this.validatePriorityCode(data.priorityCode);
    if (priorityError) return priorityError;

    // Validate deadline if provided
    const deadlineError = this.validateDeadlineDate(data.deadline);
    if (deadlineError) return deadlineError;

    // Validate assignee if provided
    const assigneeError = await this.validateAssignee(data.assignedTo, projectId);
    if (assigneeError) return assigneeError;

    return null; // All validations passed
  }
}
