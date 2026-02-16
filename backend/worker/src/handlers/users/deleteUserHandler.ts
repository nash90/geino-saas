import { UserDeleteService } from '../../services/users/UserDeleteService';
import { ErrorCodes } from '../../constants/errorCodes';
import type { OptionalAuthContext } from '../../types';

export async function deleteUserHandler(c: OptionalAuthContext) {
  const id = c.req.param('id');
  const db = c.get('db');
  const userDeleteService = new UserDeleteService(db, c.env);
  
  // Call service layer (handles both database and Supabase auth deletion)
  const result = await userDeleteService.deleteUser(id);

  if (!result.success) {
    const statusCode = result.code === 'USER_NOT_FOUND' ? 404 : 500;
    const errorCode = result.code === 'USER_NOT_FOUND' ? 
      ErrorCodes.USER_NOT_FOUND : 
      ErrorCodes.USER_DELETE_FAILED;
    return c.json({ error: result.error, errorCode }, statusCode);
  }

  return c.json({ message: 'User deleted successfully' });
}
