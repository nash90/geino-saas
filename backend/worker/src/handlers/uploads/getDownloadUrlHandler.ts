import { FileUploadService } from '../../services/uploads/FileUploadService';
import type { AuthContext } from '../../types';

export async function getDownloadUrlHandler(c: AuthContext) {
  const db = c.get('db');
  const user = c.get('user');
  const fileUploadService = new FileUploadService(db, c.env);

  // Get attachment ID from path parameter
  const attachmentId = c.req.param('attachmentId');

  // Call service layer (permission check is done inside the service)
  const result = await fileUploadService.generateDownloadUrl(user.id, attachmentId);

  if (!result.success) {
    const statusCode = result.code === 'NOT_FOUND' ? 404 :
                      result.code === 'FORBIDDEN' ? 403 :
                      result.code === 'INVALID_STATE' ? 500 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json(result.data);
}
