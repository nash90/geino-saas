import { BaseTaskService } from './BaseTaskService';
import { taskComments, users, attachments } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { ServiceResponse } from '../../types';
import type { TaskComment, TaskCommentWithUser, Attachment } from '../../types/models';
import { extractMentionedUserIds } from '../../utils/mentionParser';

/**
 * Task Comment Service
 *
 * Handles task comment operations (CRUD).
 */
export class TaskCommentService extends BaseTaskService {
  /**
   * List all comments for a task
   */
  async listComments(
    taskId: string,
    userId: string
  ): Promise<ServiceResponse<TaskCommentWithUser[]>> {
    try {
      // Validate task ID
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
      }

      // Check if user has access to this task
      const accessCheck = await this.canUserAccessTask(userId, taskId);
      if (!accessCheck.hasAccess) {
        return this.error('Task not found or access denied', 'NOT_FOUND');
      }

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

      // Fetch attachments for all comments
      const commentIds = comments.map(comment => comment.id);
      const commentAttachments = commentIds.length > 0
        ? await this.db
            .select()
            .from(attachments)
            .where(inArray(attachments.commentId, commentIds))
        : [];

      const attachmentsMap = new Map<string, Attachment[]>();
      commentAttachments.forEach(attachment => {
        if (attachment.commentId) {
          if (!attachmentsMap.has(attachment.commentId)) {
            attachmentsMap.set(attachment.commentId, []);
          }
          attachmentsMap.get(attachment.commentId)!.push(attachment as Attachment);
        }
      });

      // Add attachments to comments
      const commentsWithAttachments: TaskCommentWithUser[] = comments.map(comment => ({
        ...comment,
        attachments: attachmentsMap.get(comment.id) || [],
      }));

      return this.success(commentsWithAttachments);
    } catch (error) {
      return this.handleError(error, 'Failed to list comments');
    }
  }

  /**
   * Add a comment to a task
   */
  async addComment(
    taskId: string,
    userId: string,
    content: string,
    attachmentIds?: string[]
  ): Promise<ServiceResponse<TaskComment>> {
    try {
      // Validate task ID
      if (!this.validateUUID(taskId)) {
        return this.error('Invalid task ID', 'INVALID_INPUT');
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        return this.error('Comment content is required', 'INVALID_INPUT');
      }

      // Check if user has access to this task
      const accessCheck = await this.canUserAccessTask(userId, taskId);
      if (!accessCheck.hasAccess) {
        return this.error('Task not found or access denied', 'NOT_FOUND');
      }

      // Create comment
      const [comment] = await this.db
        .insert(taskComments)
        .values({
          taskId,
          userId,
          content: content.trim(),
        })
        .returning();

      // Link attachments to this comment if provided
      if (attachmentIds && attachmentIds.length > 0) {
        await this.db
          .update(attachments)
          .set({ commentId: comment.id })
          .where(inArray(attachments.id, attachmentIds));
      }

      // Extract mentioned user IDs from content
      // Format: @[Display Name](userId)
      const mentionedUserIds = extractMentionedUserIds(content);

      // TODO: US-20 - Emit 'comment.created' event to Cloudflare Queue
      // Event data should include:
      // - commentId: comment.id
      // - taskId: taskId
      // - createdBy: userId
      // - mentionedUserIds: mentionedUserIds (extracted from @mentions)
      // Queue consumer will:
      // 1. Create in-app notifications for mentioned users
      // 2. Send email notifications to mentioned users
      // 3. Notify task watchers (assignee, creator, etc.)

      return this.success(comment as TaskComment);
    } catch (error) {
      return this.handleError(error, 'Failed to add comment');
    }
  }

  /**
   * Update a comment
   * Only the comment owner can update their comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    content: string
  ): Promise<ServiceResponse<TaskComment>> {
    try {
      // Validate comment ID
      if (!this.validateUUID(commentId)) {
        return this.error('Invalid comment ID', 'INVALID_INPUT');
      }

      // Validate content
      if (!content || content.trim().length === 0) {
        return this.error('Comment content is required', 'INVALID_INPUT');
      }

      // Fetch comment
      const comment = await this.db.query.taskComments.findFirst({
        where: eq(taskComments.id, commentId),
      });

      if (!comment) {
        return this.error('Comment not found', 'NOT_FOUND');
      }

      // Check if user is the comment owner
      if (comment.userId !== userId) {
        return this.error('You can only edit your own comments', 'FORBIDDEN');
      }

      // Update comment
      const [updatedComment] = await this.db
        .update(taskComments)
        .set({
          content: content.trim(),
          updatedAt: this.getCurrentTimestamp(),
        })
        .where(eq(taskComments.id, commentId))
        .returning();

      return this.success(updatedComment as TaskComment);
    } catch (error) {
      return this.handleError(error, 'Failed to update comment');
    }
  }

  /**
   * Delete a comment
   * Comment owner or Project Manager+ can delete
   */
  async deleteComment(
    commentId: string,
    userId: string
  ): Promise<ServiceResponse<void>> {
    try {
      // Validate comment ID
      if (!this.validateUUID(commentId)) {
        return this.error('Invalid comment ID', 'INVALID_INPUT');
      }

      // Fetch comment
      const comment = await this.db.query.taskComments.findFirst({
        where: eq(taskComments.id, commentId),
      });

      if (!comment) {
        return this.error('Comment not found', 'NOT_FOUND');
      }

      // Check if user has permission to delete
      const isOwner = comment.userId === userId;

      if (!isOwner) {
        // Check if user is a Project Manager
        const accessCheck = await this.canUserAccessTask(userId, comment.taskId);
        if (!accessCheck.hasAccess || accessCheck.projectMember?.projectRoleCode !== 1) {
          return this.error(
            'You can only delete your own comments unless you are a Project Manager',
            'FORBIDDEN'
          );
        }
      }

      // Delete comment
      await this.db.delete(taskComments).where(eq(taskComments.id, commentId));

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, 'Failed to delete comment');
    }
  }
}
