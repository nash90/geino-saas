import { FileUploadService } from '../../services/uploads/FileUploadService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import { attachments, taskComments, tasks } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { AuthContext } from '../../types';

export async function deleteAttachmentHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Get attachment ID from path parameter
  const attachmentId = c.req.param('attachmentId');

  // Fetch attachment
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId),
  });

  if (!attachment) {
    return c.json({ error: 'Attachment not found' }, 404);
  }

  // Determine task ID from attachment
  let taskId: string | null = null;
  if (attachment.taskId) {
    taskId = attachment.taskId;
  } else if (attachment.commentId) {
    const comment = await db.query.taskComments.findFirst({
      where: eq(taskComments.id, attachment.commentId),
    });
    if (comment) {
      taskId = comment.taskId;
    }
  }

  if (!taskId) {
    return c.json({ error: 'Cannot determine task for attachment' }, 500);
  }

  // Get task to check project access
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Check if user is the uploader (can always delete own attachments)
  const isUploader = attachment.uploadedBy === user.id;

  if (!isUploader) {
    // Check if user can edit tasks (PM or above)
    const canEdit = await AuthorizationService.canEditTask(db, user, task);
    if (!canEdit) {
      return c.json({ error: 'Only the uploader or Project Managers can delete attachments' }, 403);
    }
  }

  // Call service layer to delete
  const result = await fileUploadService.deleteAttachment(attachmentId, attachment.fileUrl);

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({ message: 'Attachment deleted successfully' });
}
