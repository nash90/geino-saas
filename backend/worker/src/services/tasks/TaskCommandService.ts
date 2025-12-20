import { BaseTaskService } from './BaseTaskService';
import { tasks, projectMembers, users } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';
import type { Task } from '../../types/models';
import { TaskStatus, ProjectRole } from '../../types/codeTypes';
import { NotificationType } from '../../types/notificationTypes';

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

/**
 * Task Command Service
 *
 * Handles task write operations (create, update, delete, duplicate).
 * Access control validation is done in handlers or by calling canUserEditTask.
 */
export class TaskCommandService extends BaseTaskService {
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
      // Validate project ID
      if (!this.validateUUID(data.projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      // Validate title
      if (!data.title || data.title.trim().length === 0) {
        return this.error('Task title is required', 'INVALID_INPUT');
      }

      if (data.title.length > 500) {
        return this.error('Task title must be 500 characters or less', 'INVALID_INPUT');
      }

      // Validate status code (default to HOLD if not provided)
      const statusCode = data.statusCode !== undefined ? data.statusCode : TaskStatus.HOLD.code;

      if (!this.validateTaskStatusCode(statusCode)) {
        return this.error('Invalid status code', 'INVALID_INPUT');
      }

      // Genba Users can only create Hold status tasks
      if (userRoleCode === ProjectRole.GENBA_USER.code && statusCode !== TaskStatus.HOLD.code) {
        return this.error('Genba users can only create tasks with Hold status', 'FORBIDDEN');
      }

      // Validate type code if provided
      if (data.typeCode !== undefined && !this.validateTaskTypeCode(data.typeCode)) {
        return this.error('Invalid task type code', 'INVALID_INPUT');
      }

      // Validate priority code if provided
      if (data.priorityCode !== undefined && !this.validateTaskPriorityCode(data.priorityCode)) {
        return this.error('Invalid priority code', 'INVALID_INPUT');
      }

      // Validate deadline if provided (should be future date)
      if (data.deadline && !this.validateDeadline(data.deadline)) {
        return this.error('Deadline must be a future date', 'INVALID_INPUT');
      }

      // Validate assignedTo if provided
      if (data.assignedTo) {
        if (!this.validateUUID(data.assignedTo)) {
          return this.error('Invalid assignee user ID', 'INVALID_INPUT');
        }

        // Check if assignee is a member of the project
        const assigneeMember = await this.db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, data.projectId),
            eq(projectMembers.userId, data.assignedTo)
          ),
        });

        if (!assigneeMember) {
          return this.error('Assignee must be a member of the project', 'INVALID_INPUT');
        }
      }

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
        await this.env.NOTIFICATIONS_QUEUE.send({
          typeCode: NotificationType.TASK_ASSIGNED.code,
          payload: {
            recipientUserId: data.assignedTo,
            actorUserId: data.createdBy,
            taskId: task.id,
            projectId: data.projectId,
            timestamp: new Date().toISOString(),
          },
        });
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
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
      }

      // Check if user can edit this task
      const editCheck = await this.canUserEditTask(userId, taskId);
      if (!editCheck.canEdit) {
        return this.error('You do not have permission to edit this task', 'FORBIDDEN');
      }

      const task = editCheck.task;

      // Validate title if provided
      if (data.title !== undefined) {
        if (!data.title || data.title.trim().length === 0) {
          return this.error('Task title cannot be empty', 'INVALID_INPUT');
        }

        if (data.title.length > 500) {
          return this.error('Task title must be 500 characters or less', 'INVALID_INPUT');
        }
      }

      // Validate status code if provided
      if (data.statusCode !== undefined && !this.validateTaskStatusCode(data.statusCode)) {
        return this.error('Invalid status code', 'INVALID_INPUT');
      }

      // Genba Users cannot change task status - they can only edit other fields
      if (data.statusCode !== undefined &&
          editCheck.projectMember?.projectRoleCode === ProjectRole.GENBA_USER.code &&
          data.statusCode !== task.statusCode) {
        return this.error('Genba users cannot change task status. Only Project Managers can change task status.', 'FORBIDDEN');
      }

      // Validate type code if provided
      if (data.typeCode !== undefined && !this.validateTaskTypeCode(data.typeCode)) {
        return this.error('Invalid task type code', 'INVALID_INPUT');
      }

      // Validate priority code if provided
      if (data.priorityCode !== undefined && !this.validateTaskPriorityCode(data.priorityCode)) {
        return this.error('Invalid priority code', 'INVALID_INPUT');
      }

      // Validate deadline if provided
      if (data.deadline && !this.validateDeadline(data.deadline)) {
        return this.error('Deadline must be a future date', 'INVALID_INPUT');
      }

      // Validate assignedTo if provided
      if (data.assignedTo) {
        if (!this.validateUUID(data.assignedTo)) {
          return this.error('Invalid assignee user ID', 'INVALID_INPUT');
        }

        // Check if assignee is a member of the project
        const assigneeMember = await this.db.query.projectMembers.findFirst({
          where: and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.userId, data.assignedTo)
          ),
        });

        if (!assigneeMember) {
          return this.error('Assignee must be a member of the project', 'INVALID_INPUT');
        }
      }

      // Build update object
      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || null;
      if (data.statusCode !== undefined) updateData.statusCode = data.statusCode;
      if (data.typeCode !== undefined) updateData.typeCode = data.typeCode;
      if (data.priorityCode !== undefined) updateData.priorityCode = data.priorityCode;
      if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
      if (data.deadline !== undefined) updateData.deadline = data.deadline;
      updateData.updatedAt = this.getCurrentTimestamp();

      // Update task
      const [updatedTask] = await this.db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning();

      // Emit event if assignedTo changed
      if (updateData.assignedTo && updateData.assignedTo !== task.assignedTo) {
        await this.env.NOTIFICATIONS_QUEUE.send({
          typeCode: NotificationType.TASK_ASSIGNED.code,
          payload: {
            recipientUserId: updateData.assignedTo,
            actorUserId: userId,
            taskId,
            projectId: task.projectId,
            timestamp: new Date().toISOString(),
          },
        });
      }

      // Emit event if status changed
      if (updateData.statusCode && updateData.statusCode !== task.statusCode) {
        if (task.assignedTo) {
          await this.env.NOTIFICATIONS_QUEUE.send({
            typeCode: NotificationType.TASK_STATUS_CHANGED.code,
            payload: {
              recipientUserId: task.assignedTo,
              actorUserId: userId,
              taskId,
              projectId: task.projectId,
              oldValue: task.statusCode,
              newValue: updateData.statusCode,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

      // Emit event if other details changed (title, description, deadline)
      if (updateData.title || updateData.description || updateData.deadline) {
        // Notify assignee if they didn't make the change
        if (task.assignedTo && task.assignedTo !== userId) {
          await this.env.NOTIFICATIONS_QUEUE.send({
            typeCode: NotificationType.TASK_DETAIL_CHANGED.code,
            payload: {
              recipientUserId: task.assignedTo,
              actorUserId: userId,
              taskId,
              projectId: task.projectId,
              timestamp: new Date().toISOString(),
            },
          });
        }

        // Notify creator if they didn't make the change and aren't the assignee
        if (task.createdBy !== userId && task.createdBy !== task.assignedTo) {
          await this.env.NOTIFICATIONS_QUEUE.send({
            typeCode: NotificationType.TASK_UPDATED.code,
            payload: {
              recipientUserId: task.createdBy,
              actorUserId: userId,
              taskId,
              projectId: task.projectId,
              timestamp: new Date().toISOString(),
            },
          });
        }
      }

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
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
      }

      // Validate status code
      if (!this.validateTaskStatusCode(statusCode)) {
        return this.error('Invalid status code', 'INVALID_INPUT');
      }

      // Check if user can edit this task
      const editCheck = await this.canUserEditTask(userId, taskId);
      if (!editCheck.canEdit) {
        return this.error('You do not have permission to edit this task', 'FORBIDDEN');
      }

      // Genba Users cannot change task status via drag-and-drop
      if (editCheck.projectMember?.projectRoleCode === ProjectRole.GENBA_USER.code) {
        return this.error('Genba users cannot change task status. Only Project Managers can change task status.', 'FORBIDDEN');
      }

      // Update status
      const [updatedTask] = await this.db
        .update(tasks)
        .set({
          statusCode,
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(tasks.id, taskId))
        .returning();

      const task = editCheck.task;

      // Emit task status changed event if assignee exists
      if (task.assignedTo) {
        await this.env.NOTIFICATIONS_QUEUE.send({
          typeCode: NotificationType.TASK_STATUS_CHANGED.code,
          payload: {
            recipientUserId: task.assignedTo,
            actorUserId: userId,
            taskId,
            projectId: task.projectId,
            oldValue: task.statusCode,
            newValue: statusCode,
            timestamp: new Date().toISOString(),
          },
        });
      }

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
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
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
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
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
}
