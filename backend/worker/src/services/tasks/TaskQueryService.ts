import { BaseTaskService } from './BaseTaskService';
import { tasks, users, projectMembers, taskComments, attachments } from '../../db/schema';
import { eq, sql, desc, and, gte, lte, inArray } from 'drizzle-orm';
import type {
  ServiceResponse,
  PaginationParams,
  PaginatedResponse,
} from '../../types';
import type {
  Task,
  TaskWithDetails,
  TaskWithComments,
  TaskCommentWithUser,
  Attachment
} from '../../types/models';

export interface TaskListOptions extends PaginationParams {
  statusCode?: number;
  assignedTo?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface CalendarTask {
  date: string;
  tasks: TaskWithDetails[];
}

/**
 * Task Query Service
 *
 * Handles task read operations with pagination and filtering.
 */
export class TaskQueryService extends BaseTaskService {
  /**
   * List tasks for a project with pagination and filtering
   */
  async listTasks(
    projectId: string,
    userId: string,
    options: TaskListOptions
  ): Promise<ServiceResponse<PaginatedResponse<TaskWithDetails>>> {
    try {
      if (!this.validateUUID(projectId)) {
        return this.error('Invalid project ID', 'INVALID_INPUT');
      }

      // Check if user has access to the project
      const projectMember = await this.db.query.projectMembers.findFirst({
        where: and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        ),
      });

      if (!projectMember) {
        return this.error('You do not have access to this project', 'FORBIDDEN');
      }

      const normalizedParams = this.normalizePaginationParams(
        options.page || 1,
        options.limit || 20
      );
      const limit = normalizedParams.limit;
      const offset = this.calculateOffset(normalizedParams.page, normalizedParams.limit);

      // Build WHERE conditions
      const whereConditions = [eq(tasks.projectId, projectId)];

      if (options.statusCode) {
        whereConditions.push(eq(tasks.statusCode, options.statusCode));
      }

      if (options.assignedTo) {
        whereConditions.push(eq(tasks.assignedTo, options.assignedTo));
      }

      if (options.fromDate) {
        whereConditions.push(gte(tasks.deadline, options.fromDate));
      }

      if (options.toDate) {
        whereConditions.push(lte(tasks.deadline, options.toDate));
      }

      const whereClause = whereConditions.length > 1
        ? and(...whereConditions)
        : whereConditions[0];

      // Count total matching tasks
      const countResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(tasks)
        .where(whereClause);

      const total = Number(countResult[0]?.count || 0);

      // Fetch tasks with assignee and creator details
      const tasksList = await this.db
        .select({
          id: tasks.id,
          projectId: tasks.projectId,
          title: tasks.title,
          description: tasks.description,
          statusCode: tasks.statusCode,
          typeCode: tasks.typeCode,
          priorityCode: tasks.priorityCode,
          assignedTo: tasks.assignedTo,
          createdBy: tasks.createdBy,
          deadline: tasks.deadline,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(whereClause)
        .orderBy(desc(tasks.createdAt))
        .limit(limit)
        .offset(offset);

      // Fetch assignees and creators for all tasks
      const userIds = new Set<string>();
      tasksList.forEach(task => {
        if (task.assignedTo) userIds.add(task.assignedTo);
        if (task.createdBy) userIds.add(task.createdBy);
      });

      const taskUsers = userIds.size > 0
        ? await this.db
            .select({
              id: users.id,
              email: users.email,
              firstname: users.firstname,
              lastname: users.lastname,
            })
            .from(users)
            .where(inArray(users.id, Array.from(userIds)))
        : [];

      const userMap = new Map(taskUsers.map(user => [user.id, user]));

      // Fetch attachments for all tasks
      const taskIds = tasksList.map(task => task.id);
      const taskAttachments = taskIds.length > 0
        ? await this.db
            .select()
            .from(attachments)
            .where(
              and(
                inArray(attachments.taskId, taskIds),
                sql`${attachments.commentId} IS NULL` // Only task-level attachments
              )
            )
        : [];

      const attachmentsMap = new Map<string, Attachment[]>();
      taskAttachments.forEach(attachment => {
        if (attachment.taskId) {
          if (!attachmentsMap.has(attachment.taskId)) {
            attachmentsMap.set(attachment.taskId, []);
          }
          attachmentsMap.get(attachment.taskId)!.push(attachment as Attachment);
        }
      });

      // Combine tasks with user details and attachments
      const items: TaskWithDetails[] = tasksList.map(task => ({
        ...task,
        assignee: task.assignedTo ? userMap.get(task.assignedTo) : undefined,
        creator: userMap.get(task.createdBy),
        attachments: attachmentsMap.get(task.id) || [],
      }));

      return this.success({
        items,
        pagination: {
          page: normalizedParams.page,
          limit: normalizedParams.limit,
          total,
          totalPages: Math.ceil(total / normalizedParams.limit),
        },
      });
    } catch (error) {
      return this.handleError(error, 'Failed to list tasks');
    }
  }

  /**
   * Get task by ID with full details including comments
   */
  async getTaskById(
    taskId: string,
    userId: string
  ): Promise<ServiceResponse<TaskWithComments>> {
    try {
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
      }

      // Check if user has access to this task
      const accessCheck = await this.canUserAccessTask(userId, taskId);
      if (!accessCheck.hasAccess) {
        return this.error('Task not found or access denied', 'NOT_FOUND');
      }

      const task = accessCheck.task;

      // Fetch assignee and creator details
      const userIds = new Set<string>();
      if (task.assignedTo) userIds.add(task.assignedTo);
      if (task.createdBy) userIds.add(task.createdBy);

      const taskUsers = userIds.size > 0
        ? await this.db
            .select({
              id: users.id,
              email: users.email,
              firstname: users.firstname,
              lastname: users.lastname,
            })
            .from(users)
            .where(inArray(users.id, Array.from(userIds)))
        : [];

      const userMap = new Map(taskUsers.map(user => [user.id, user]));

      // Fetch task-level attachments
      const taskAttachments = await this.db
        .select()
        .from(attachments)
        .where(
          and(
            eq(attachments.taskId, taskId),
            sql`${attachments.commentId} IS NULL`
          )
        );

      // Fetch comments with user details
      const comments = await this.db
        .select({
          id: taskComments.id,
          taskId: taskComments.taskId,
          userId: taskComments.userId,
          content: taskComments.content,
          createdAt: taskComments.createdAt,
          updatedAt: taskComments.updatedAt,
          user: {
            id: users.id,
            email: users.email,
            firstname: users.firstname,
            lastname: users.lastname,
          },
        })
        .from(taskComments)
        .innerJoin(users, eq(taskComments.userId, users.id))
        .where(eq(taskComments.taskId, taskId))
        .orderBy(taskComments.createdAt);

      // Fetch comment attachments
      const commentIds = comments.map(comment => comment.id);
      const commentAttachments = commentIds.length > 0
        ? await this.db
            .select()
            .from(attachments)
            .where(inArray(attachments.commentId, commentIds))
        : [];

      const commentAttachmentsMap = new Map<string, Attachment[]>();
      commentAttachments.forEach(attachment => {
        if (attachment.commentId) {
          if (!commentAttachmentsMap.has(attachment.commentId)) {
            commentAttachmentsMap.set(attachment.commentId, []);
          }
          commentAttachmentsMap.get(attachment.commentId)!.push(attachment as Attachment);
        }
      });

      // Add attachments to comments
      const commentsWithAttachments: TaskCommentWithUser[] = comments.map(comment => ({
        ...comment,
        attachments: commentAttachmentsMap.get(comment.id) || [],
      }));

      const taskWithDetails: TaskWithComments = {
        ...task,
        assignee: task.assignedTo ? userMap.get(task.assignedTo) : undefined,
        creator: userMap.get(task.createdBy),
        attachments: taskAttachments as Attachment[],
        comments: commentsWithAttachments,
      };

      return this.success(taskWithDetails);
    } catch (error) {
      return this.handleError(error, 'Failed to get task');
    }
  }

  /**
   * Get tasks for calendar view
   * Groups tasks by deadline date across multiple projects
   */
  async getTasksForCalendar(
    projectIds: string[],
    userId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<ServiceResponse<CalendarTask[]>> {
    try {
      if (projectIds.length === 0) {
        return this.success([]);
      }

      // Validate all project IDs
      for (const projectId of projectIds) {
        if (!this.validateUUID(projectId)) {
          return this.error('Invalid project ID in list', 'INVALID_INPUT');
        }
      }

      // Check user has access to all projects
      const userProjects = await this.db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.userId, userId),
            inArray(projectMembers.projectId, projectIds)
          )
        );

      const accessibleProjectIds = new Set(userProjects.map(p => p.projectId));
      const hasAccessToAll = projectIds.every(id => accessibleProjectIds.has(id));

      if (!hasAccessToAll) {
        return this.error('Access denied to one or more projects', 'FORBIDDEN');
      }

      // Fetch tasks with deadlines in the date range
      const tasksList = await this.db
        .select({
          id: tasks.id,
          projectId: tasks.projectId,
          title: tasks.title,
          description: tasks.description,
          statusCode: tasks.statusCode,
          typeCode: tasks.typeCode,
          priorityCode: tasks.priorityCode,
          assignedTo: tasks.assignedTo,
          createdBy: tasks.createdBy,
          deadline: tasks.deadline,
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(
          and(
            inArray(tasks.projectId, projectIds),
            sql`${tasks.deadline} IS NOT NULL`,
            gte(tasks.deadline, fromDate),
            lte(tasks.deadline, toDate)
          )
        )
        .orderBy(tasks.deadline);

      // Fetch users
      const userIds = new Set<string>();
      tasksList.forEach(task => {
        if (task.assignedTo) userIds.add(task.assignedTo);
        if (task.createdBy) userIds.add(task.createdBy);
      });

      const taskUsers = userIds.size > 0
        ? await this.db
            .select({
              id: users.id,
              email: users.email,
              firstname: users.firstname,
              lastname: users.lastname,
            })
            .from(users)
            .where(inArray(users.id, Array.from(userIds)))
        : [];

      const userMap = new Map(taskUsers.map(user => [user.id, user]));

      // Group tasks by date
      const tasksByDate = new Map<string, TaskWithDetails[]>();

      tasksList.forEach(task => {
        if (task.deadline) {
          const dateKey = task.deadline.toISOString().split('T')[0]; // YYYY-MM-DD
          if (!tasksByDate.has(dateKey)) {
            tasksByDate.set(dateKey, []);
          }

          tasksByDate.get(dateKey)!.push({
            ...task,
            assignee: task.assignedTo ? userMap.get(task.assignedTo) : undefined,
            creator: userMap.get(task.createdBy),
            attachments: [], // No attachments in calendar view for performance
          });
        }
      });

      // Convert map to array
      const calendarTasks: CalendarTask[] = Array.from(tasksByDate.entries()).map(
        ([date, tasks]) => ({ date, tasks })
      );

      return this.success(calendarTasks);
    } catch (error) {
      return this.handleError(error, 'Failed to get calendar tasks');
    }
  }
}
