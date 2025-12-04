import { UserQueryService } from '../../services/users/UserQueryService';
import type { OptionalAuthContext } from '../../types';

export async function listUsersHandler(c: OptionalAuthContext) {
  const db = c.get('db');
  const userQueryService = new UserQueryService(db, c.env);
  
  // Get pagination and search parameters from query string
  const page = c.req.query('page');
  const limit = c.req.query('limit');
  const search = c.req.query('search');

  // Call service layer with search parameter
  const result = await userQueryService.listUsers(page, limit, search);

  if (!result.success) {
    return c.json({ error: result.error }, 500);
  }

  return c.json({
    users: result.data!.items,
    pagination: result.data!.pagination,
  });
}
