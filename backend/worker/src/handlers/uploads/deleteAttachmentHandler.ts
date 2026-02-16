import { FileUploadService } from '../../services/uploads/FileUploadService';
import { AuthorizationService } from '../../services/auth/AuthorizationService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { AuthContext } from '../../types';

export async function deleteAttachmentHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Get attachment ID from path parameter
  const attachmentId = c.req.param('attachmentId');

  // Get attachment with task context
  const contextResult = await fileUploadService.getAttachmentWithTaskContext(attachmentId);
  if (!contextResult.success) {
    const statusCode = contextResult.code === 'NOT_FOUND' ? 404 : 500;
    const errorCode = contextResult.code === 'NOT_FOUND' ? ErrorCodes.ATTACHMENT_NOT_FOUND : undefined;
    return c.json({ error: contextResult.error, errorCode }, statusCode);
  }

  const { attachment, task } = contextResult.data!;

  // Check if user is the uploader (can always delete own attachments)
  const isUploader = attachment.uploadedBy === user.id;

  if (!isUploader) {
    // Check if user can edit tasks (PM or above)
    const canEdit = await AuthorizationService.canEditTask(db, user, task as any);
    if (!canEdit) {
      return c.json({ 
        error: 'Only the uploader or Project Managers can delete attachments',
        errorCode: ErrorCodes.NO_ATTACHMENT_DELETE
      }, 403);
    }
  }

  // Call service layer to delete
  const result = await fileUploadService.deleteAttachment(attachmentId);

  if (!result.success) {
    return c.json({ 
      error: result.error,
      errorCode: ErrorCodes.ATTACHMENT_DELETE_FAILED
    }, 500);
  }

  return c.json({ message: 'Attachment deleted successfully' });
}
