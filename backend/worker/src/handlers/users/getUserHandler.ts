import { UserQueryService } from '../../services/users/UserQueryService';
import type { OptionalAuthContext } from '../../types';

export async function getUserHandler(c: OptionalAuthContext) {
  const id = c.req.param('id');
  const db = c.get('db');
  const userQueryService = new UserQueryService(db, c.env);
  
  // Call service layer
  const result = await userQueryService.getUserById(id);

  if (!result.success) {
    const statusCode = result.code === 'USER_NOT_FOUND' ? 404 : 500;
    return c.json({ error: result.error }, statusCode);
  }

  return c.json({ user: result.data });
}
