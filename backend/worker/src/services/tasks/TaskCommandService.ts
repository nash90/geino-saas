import { BaseTaskService } from './BaseTaskService';
import { tasks, projectMembers } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';
import type { Task } from '../../types/models';
import { TaskStatus, ProjectRole } from '../../types/codeTypes';
import { NotificationType } from '../../types/notificationTypes';
import { 
  TaskCommandValidationService, 
  type CreateTaskData, 
  type UpdateTaskData 
} from '../validation/TaskCommandValidationService';

/**
 * Task Command Service
 *
 * Handles task write operations (create, update, delete, duplicate).
 * Access control validation is done in handlers or by calling canUserEditTask.
 */
export class TaskCommandService extends BaseTaskService {
  private validationService: TaskCommandValidationService;

  constructor(db: any, env: any) {
    super(db, env);
    this.validationService = new TaskCommandValidationService(db, env);
  }

  /**
   * Create a new task
   * Access control:
   * - Project Managers can create tasks with any status
   * - Genba Users can create tasks with Hold status only
   */
  async createTask(
    data: CreateTaskData,
    userRoleCode: number
  ): Promise<ServiceResponse<Task>> {
    try {
      // Validate all input data
      const validationError = await this.validationService.validateCreateTaskData(data, userRoleCode);
      if (validationError) {
        return this.error(validationError.error, validationError.code);
      }

      // Get status code (default to HOLD if not provided)
      const statusCode = data.statusCode !== undefined ? data.statusCode : TaskStatus.HOLD.code;

      // Create task
      const [task] = await this.db
        .insert(tasks)
        .values({
          projectId: data.projectId,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          statusCode,
          typeCode: data.typeCode || null,
          priorityCode: data.priorityCode || null,
          assignedTo: data.assignedTo || null,
          deadline: data.deadline || null,
          createdBy: data.createdBy,
        })
        .returning();

      // Emit task assigned event if assignedTo is set
      if (data.assignedTo) {
        await this.notifyTaskAssigned(data.assignedTo, data.createdBy, task.id, data.projectId);
      }

      return this.success(task as Task);
    } catch (error) {
      return this.handleError(error, 'Failed to create task');
    }
  }

  /**
   * Update task
   * Access control should be validated before calling this method
   */
  async updateTask(
    taskId: string,
    data: UpdateTaskData,
    userId: string
  ): Promise<ServiceResponse<Task>> {
    try {
      // Validate task ID
      const taskIdError = this.validationService.validateTaskId(taskId);
      if (taskIdError) {
        return this.error(taskIdError.error, taskIdError.code);
      }

      // Check if user can edit this task
      const editCheck = await this.canUserEditTask(userId, taskId);
      if (!editCheck.canEdit) {
        return this.error('You do not have permission to edit this task', 'FORBIDDEN');
      }

      const task = editCheck.task;

      // Validate all update data
      const validationError = await this.validationService.validateUpdateTaskData(
        data,
        task.projectId,
        task.statusCode,
        editCheck.projectMember?.projectRoleCode
      );
      if (validationError) {
        return this.error(validationError.error, validationError.code);
      }

      // Build update object
      const updateData = this.buildUpdateObject(data);

      // Update task
      const [updatedTask] = await this.db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning();

      // Handle notifications
      await this.handleUpdateNotifications(task, updateData, taskId, userId);

      return this.success(updatedTask as Task);
    } catch (error) {
      return this.handleError(error, 'Failed to update task');
    }
  }

  /**
   * Update task status only (for drag-and-drop operations)
   * Access control should be validated before calling this method
   */
  async updateTaskStatus(
    taskId: string,
    statusCode: number,
    userId: string
  ): Promise<ServiceResponse<Task>> {
    try {
      // Validate task ID
      const taskIdError = this.validationService.validateTaskId(taskId);
      if (taskIdError) {
        return this.error(taskIdError.error, taskIdError.code);
      }

      // Validate status code
      const statusError = this.validationService.validateStatusCode(statusCode);
      if (statusError) {
        return this.error(statusError.error, statusError.code);
      }

      // Check if user can edit this task
      const editCheck = await this.canUserEditTask(userId, taskId);
      if (!editCheck.canEdit) {
        return this.error('You do not have permission to edit this task', 'FORBIDDEN');
      }

      // Genba Users cannot change task status via drag-and-drop
      const genbaError = this.validationService.validateGenbaUserStatusChange(
        editCheck.projectMember?.projectRoleCode,
        editCheck.task.statusCode,
        statusCode
      );
      if (genbaError) {
        return this.error(genbaError.error, genbaError.code);
      }

      const task = editCheck.task;

      // Update status
      const [updatedTask] = await this.db
        .update(tasks)
        .set({
          statusCode,
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      // Emit task status changed event - notify ALL project members
      await this.notifyProjectMembers(
        task.projectId,
        taskId,
        userId,
        NotificationType.TASK_STATUS_CHANGED.code,
        {
          oldValue: task.statusCode,
          newValue: statusCode,
        }
      );

      return this.success(updatedTask as Task);
    } catch (error) {
      return this.handleError(error, 'Failed to update task status');
    }
  }

  /**
   * Delete task
   * Access control should be validated before calling this method (PM+ only)
   */
  async deleteTask(taskId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      // Validate task ID
      const taskIdError = this.validationService.validateTaskId(taskId);
      if (taskIdError) {
        return this.error(taskIdError.error, taskIdError.code);
      }

      // Check if task exists and user has access
      const accessCheck = await this.canUserAccessTask(userId, taskId);
      if (!accessCheck.hasAccess || !accessCheck.task) {
        return this.error('Task not found or access denied', 'NOT_FOUND');
      }

      // Only Project Managers can delete tasks
      if (accessCheck.projectMember?.projectRoleCode !== ProjectRole.PROJECT_MANAGER.code) {
        return this.error('Only Project Managers can delete tasks', 'FORBIDDEN');
      }

      // Delete task (comments and attachments will be handled by application logic)
      await this.db.delete(tasks).where(eq(tasks.id, taskId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete task');
    }
  }

  /**
   * Duplicate task
   * Creates a copy of the task excluding comments and attachments
   * Appends " (Copy)" to the title
   */
  async duplicateTask(
    taskId: string,
    userId: string,
    userRoleCode: number
  ): Promise<ServiceResponse<Task>> {
    try {
      // Validate task ID
      const taskIdError = this.validationService.validateTaskId(taskId);
      if (taskIdError) {
        return this.error(taskIdError.error, taskIdError.code);
      }

      // Check if task exists and user has access
      const accessCheck = await this.canUserAccessTask(userId, taskId);
      if (!accessCheck.hasAccess || !accessCheck.task) {
        return this.error('Task not found or access denied', 'NOT_FOUND');
      }

      const originalTask = accessCheck.task;

      // Create new task with copied values
      const [duplicatedTask] = await this.db
        .insert(tasks)
        .values({
          projectId: originalTask.projectId,
          title: `${originalTask.title} (Copy)`,
          description: originalTask.description,
          statusCode: originalTask.statusCode,
          typeCode: originalTask.typeCode,
          priorityCode: originalTask.priorityCode,
          assignedTo: null, // Don't copy assignee
          deadline: originalTask.deadline,
          createdBy: userId, // Current user is the creator
        })
        .returning();

      return this.success(duplicatedTask as Task);
    } catch (error) {
      return this.handleError(error, 'Failed to duplicate task');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Helper: Build update object from data
   */
  private buildUpdateObject(data: UpdateTaskData): any {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
    if (data.typeCode !== undefined) updateData.typeCode = data.typeCode;
    if (data.priorityCode !== undefined) updateData.priorityCode = data.priorityCode;
    if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
    if (data.deadline !== undefined) updateData.deadline = data.deadline;

    updateData.updatedAt = this.getCurrentTimestamp();

    return updateData;
  }

  /**
   * Helper: Check if any field was changed
   */
  private hasAnyFieldChanged(updateData: any): boolean {
    return !!(
      updateData.title ||
      updateData.description ||
      updateData.deadline ||
      updateData.priorityCode ||
      updateData.typeCode ||
      updateData.assignedTo ||
      updateData.statusCode
    );
  }

  /**
   * Helper: Get list of changed fields for tracking
   */
  private getChangedFields(updateData: any, originalTask: Task): string[] {
    const changedFields: string[] = [];

    if (updateData.title !== undefined) changedFields.push('title');
    if (updateData.description !== undefined) changedFields.push('description');
    if (updateData.deadline !== undefined) changedFields.push('deadline');
    if (updateData.priorityCode !== undefined) changedFields.push('priority');
    if (updateData.typeCode !== undefined) changedFields.push('type');
    if (updateData.assignedTo !== undefined && updateData.assignedTo !== originalTask.assignedTo) {
      changedFields.push('assignee');
    }
    if (updateData.statusCode !== undefined && updateData.statusCode !== originalTask.statusCode) {
      changedFields.push('status');
    }

    return changedFields;
  }

  /**
   * Helper: Handle all update notifications
   * Sends ONE notification (TASK_UPDATED) with all changed fields
   */
  private async handleUpdateNotifications(
    originalTask: Task,
    updateData: any,
    taskId: string,
    userId: string
  ): Promise<void> {
    // Check if any field changed
    if (!this.hasAnyFieldChanged(updateData)) {
      return; // No changes, no notification
    }

    // Build changed fields list
    const changedFields = this.getChangedFields(updateData, originalTask);

    // Build additional payload with status change info if status changed
    const additionalPayload: any = { changedFields };
    if (updateData.statusCode !== undefined && updateData.statusCode !== originalTask.statusCode) {
      additionalPayload.oldStatus = originalTask.statusCode;
      additionalPayload.newStatus = updateData.statusCode;
    }

    // Send single TASK_UPDATED notification to all project members
    await this.notifyProjectMembers(
      originalTask.projectId,
      taskId,
      userId,
      NotificationType.TASK_UPDATED.code,
      additionalPayload
    );
  }

  /**
   * Helper: Notify user about task assignment
   */
  private async notifyTaskAssigned(
    recipientUserId: string,
    actorUserId: string,
    taskId: string,
    projectId: string
  ): Promise<void> {
    await this.env.NOTIFICATIONS_QUEUE.send({
      typeCode: NotificationType.TASK_ASSIGNED.code,
      payload: {
        recipientUserId,
        actorUserId,
        taskId,
        projectId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Helper: Notify all project members about task update
   */
  private async notifyProjectMembers(
    projectId: string,
    taskId: string,
    actorUserId: string,
    notificationTypeCode: number,
    additionalPayload: Record<string, any> = {}
  ): Promise<void> {
    // Fetch all project members
    const members = await this.db.query.projectMembers.findMany({
      where: eq(projectMembers.projectId, projectId),
    });

    // Send notification to each member (except the person who made the change)
    for (const member of members) {
      if (member.userId !== actorUserId) {
        await this.env.NOTIFICATIONS_QUEUE.send({
          typeCode: notificationTypeCode,
          payload: {
            recipientUserId: member.userId,
            actorUserId,
            taskId,
            projectId,
            timestamp: new Date().toISOString(),
            ...additionalPayload,
          },
        });
      }
    }
  }
}
