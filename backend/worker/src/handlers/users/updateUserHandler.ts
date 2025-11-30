import { UserUpdateService } from '../../services/users/UserUpdateService';
import type { OptionalAuthContext } from '../../types';

export async function updateUserHandler(c: OptionalAuthContext) {
  const id = c.req.param('id');
  const { systemRoleCode } = await c.req.json();
  
  const db = c.get('db');
  const userUpdateService = new UserUpdateService(db, c.env);
  
  // Call service layer
  const result = await userUpdateService.updateUserRole(id, systemRoleCode);

  if (!result.success) {
    const statusCode = result.code === 'USER_NOT_FOUND' ? 404 : 400;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ 
    message: 'User updated successfully',
    user: result.data 
  });
}
