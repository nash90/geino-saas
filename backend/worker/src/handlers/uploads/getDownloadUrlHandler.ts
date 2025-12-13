import { FileUploadService } from '../../services/uploads/FileUploadService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import type { AuthContext } from '../../types';

export async function getDownloadUrlHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Get attachment ID from path parameter
  const attachmentId = c.req.param('attachmentId');

  // Get attachment with task context
  const contextResult = await fileUploadService.getAttachmentWithTaskContext(attachmentId);
  if (!contextResult.success) {
    const statusCode = contextResult.code === 'NOT_FOUND' ? 404 : 500;
    return c.json({ error: contextResult.error }, statusCode);
  }

  const { attachment, task } = contextResult.data!;

  // Verify user has access to view tasks in this project
  const canAccess = await AuthorizationService.canViewTask(db, user, task.projectId);
  if (!canAccess) {
    return c.json({ error: 'You do not have access to this attachment' }, 403);
  }

  // Call service layer to generate URL
  const result = await fileUploadService.generateDownloadUrl(attachment.fileUrl);

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json(result.data);
}
